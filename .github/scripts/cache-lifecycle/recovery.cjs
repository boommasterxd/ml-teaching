"use strict";

const { identifier, object, replacements, run, text } = require("./planner.cjs");
/** @typedef {import('./types').Policy} Policy */
/** @typedef {import('./types').Replacement} Replacement */
/** @typedef {import('./types').Options} Options */
/** @typedef {import('./types').Run} Run */
const cleanupJobName = "Retire replaced caches";

/** @param {unknown} value @param {Policy} rules @returns {Replacement[]} */
function receipts(value, rules) {
  if (!Array.isArray(value) || value.length > 20)
    throw new Error("Invalid or oversized replacement receipts");
  const result = value.map((raw) => {
    const item = object(raw);
    return { family: text(item.family), key: text(item.key), prefix: text(item.prefix) };
  });
  // Reuse the normal family, compatibility and duplicate validation before recovery.
  replacements([], result, rules);
  return result;
}

/** @param {Options} options @param {Policy} rules @param {string} base */
function latestProducerRun(options, rules, base) {
  const query = new URLSearchParams({ branch: rules.defaultBranch, per_page: "20" });
  const runs = rules.producerWorkflows.flatMap((workflow) => {
    const file = encodeURIComponent(workflow.path.slice(workflow.path.lastIndexOf("/") + 1));
    const page = object(options.api.read(`${base}/actions/workflows/${file}/runs?${query}`));
    const rows = page.workflow_runs;
    if (
      !Number.isSafeInteger(page.total_count) ||
      !Array.isArray(rows) ||
      rows.length !== Math.min(20, Number(page.total_count))
    ) {
      throw new Error("Invalid producer recovery page");
    }
    return rows.map((entry) => ({ source: run(entry), workflow }));
  });
  if (new Set(runs.map(({ source }) => source.id)).size !== runs.length) {
    throw new Error("Ambiguous producer recovery page");
  }
  // Select before inspecting the outcome so a newer unverified attempt cannot
  // expose an older receipt for rotation.
  return runs.sort((a, b) => b.source.id - a.source.id)[0];
}

/** @param {Options} options @param {Policy} rules @param {string} base @param {string} source @param {string} head */
function unchangedInputs(options, rules, base, source, head) {
  if (source === head) return true;
  const comparison = object(options.api.read(`${base}/compare/${source}...${head}?per_page=100`));
  const total = comparison.total_commits;
  if (
    !Number.isSafeInteger(total) ||
    Number(total) < 1 ||
    Number(total) > 100 ||
    comparison.ahead_by !== total ||
    comparison.status !== "ahead" ||
    !Array.isArray(comparison.commits) ||
    comparison.commits.length !== total ||
    !Array.isArray(comparison.files) ||
    comparison.files.length >= 300
  )
    return false;
  if (
    object(comparison.base_commit).sha !== source ||
    object(comparison.merge_base_commit).sha !== source ||
    object(comparison.commits.at(-1)).sha !== head
  )
    return false;
  return comparison.files.every((raw) => {
    const file = object(raw);
    const paths = [text(file.filename)];
    if (file.previous_filename !== undefined) paths.push(text(file.previous_filename));
    return paths.every(
      (filename) =>
        !rules.producerInputs.some((input) =>
          input.endsWith("/") ? filename.startsWith(input) : filename === input,
        ),
    );
  });
}

/** @param {Record<string, unknown>} job @param {Run} source @param {string} conclusion */
function completedJobOfAttempt(job, source, conclusion) {
  return (
    job.status === "completed" &&
    job.conclusion === conclusion &&
    job.run_id === source.id &&
    job.run_attempt === source.run_attempt &&
    job.head_sha === source.head_sha
  );
}

/** @param {import('./types').Api} api @param {string} base @param {Run} source @param {string | undefined} name */
function successfulWarmJob(api, base, source, name) {
  if (!name) return false;
  const jobs = api
    .list(
      `${base}/actions/runs/${source.id}/attempts/${source.run_attempt}/jobs?per_page=100`,
      "jobs",
    )
    .map(object);
  const warm = jobs.filter((job) => job.name === name);
  if (warm.length !== 1 || !completedJobOfAttempt(warm[0], source, "success")) return false;
  if (source.conclusion !== "failure") return true;
  const incomplete = jobs.filter((job) => !completedJobOfAttempt(job, source, "success"));
  return (
    incomplete.length === 1 &&
    jobs.filter((job) => job.name === cleanupJobName).length === 1 &&
    incomplete[0].name === cleanupJobName &&
    completedJobOfAttempt(incomplete[0], source, "failure")
  );
}

/** @param {Run} source @param {Policy} rules @param {import('./types').Workflow} workflow */
function producerOrigin(source, rules, workflow) {
  if (
    source.status !== "completed" ||
    !["success", "failure"].includes(source.conclusion ?? "") ||
    source.head_branch !== rules.defaultBranch ||
    !["push", "workflow_dispatch"].includes(source.event) ||
    source.name !== workflow.name ||
    source.path.split("@")[0] !== workflow.path ||
    source.repository?.full_name !== rules.repository ||
    source.head_repository?.full_name !== rules.repository ||
    source.repository.id !== source.head_repository.id
  ) {
    return;
  }
  identifier(source.workflow_id);
  return {
    runId: source.id,
    attempt: source.run_attempt,
    head: source.head_sha,
    branch: source.head_branch,
    repositoryId: identifier(source.repository.id),
  };
}

/** @param {Run} source @param {Run} latest @param {Policy} rules @param {import('./types').Workflow} workflow */
function sameProducerAttempt(source, latest, rules, workflow) {
  return (
    Boolean(producerOrigin(latest, rules, workflow)) &&
    latest.id === source.id &&
    latest.run_attempt === source.run_attempt &&
    latest.workflow_id === source.workflow_id &&
    latest.head_sha === source.head_sha &&
    latest.repository?.id === source.repository?.id &&
    latest.event === source.event &&
    latest.conclusion === source.conclusion
  );
}

/** @param {Options} options @param {Policy} rules @param {string} base @param {string} head @returns {Replacement[]} */
function recoverReceipts(options, rules, base, head) {
  const newest = latestProducerRun(options, rules, base);
  if (!newest) return [];
  const { source, workflow } = newest;
  const origin = producerOrigin(source, rules, workflow);
  if (!origin || !unchangedInputs(options, rules, base, source.head_sha, head)) return [];
  const path = `${base}/actions/runs/${source.id}`;
  if (!sameProducerAttempt(source, run(options.api.read(path)), rules, workflow)) return [];
  if (!successfulWarmJob(options.api, base, source, workflow.job)) return [];
  const saved = receipts(options.api.readReceipts(origin), rules);
  if (!saved.length) return [];
  const current = latestProducerRun(options, rules, base);
  if (!current || !sameProducerAttempt(source, current.source, rules, workflow)) return [];
  const latest = run(options.api.read(path));
  return sameProducerAttempt(source, latest, rules, workflow) ? saved : [];
}

module.exports = { recoverReceipts, successfulWarmJob };
