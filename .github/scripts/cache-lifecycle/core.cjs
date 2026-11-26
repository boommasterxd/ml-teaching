"use strict";

const {
  cache,
  codeql,
  codeqlIdentity,
  identifier,
  object,
  policy,
  replacements,
  run,
  text,
} = require("./planner.cjs");
const { recoverReceipts, successfulWarmJob } = require("./recovery.cjs");
const deletionLimit = 100;
const mainBatchLimit = 20;
const pullRequestLimit = 100;
const codeqlProofLimit = 25;
/** @typedef {import('./types').Options} Options */
/** @typedef {import('./types').Api} Api */
/** @typedef {import('./types').Policy} Policy */
/** @typedef {import('./types').Cache} Cache */
/** @typedef {import('./types').Candidate} Candidate */

/** @param {Api} api @param {string} base */
function inventory(api, base) {
  return api.list(`${base}/actions/caches?per_page=100`, "actions_caches").map(cache);
}

/** @param {Api} api @param {string} base @param {number} self */
function activeRuns(api, base, self) {
  return ["queued", "in_progress", "waiting", "requested", "pending"]
    .flatMap((status) =>
      api.list(`${base}/actions/runs?status=${status}&per_page=100`, "workflow_runs").map(run),
    )
    .filter((r) => r.id !== self);
}

/** @param {import('./types').Run} entry */
function isLifecycleRun(entry) {
  return (
    entry.name === "Cache lifecycle" &&
    entry.path === ".github/workflows/cache-lifecycle.yml" &&
    ["pull_request_target", "workflow_run"].includes(entry.event)
  );
}

/** @param {Options} options @param {string} base @param {import('./types').Run[]} running */
function blocksMainRotation(options, base, running) {
  if (!running.length) return false;
  if (
    options.workflow !== "Cache lifecycle" ||
    !running.every((entry) => isLifecycleRun(entry) && ["queued", "pending"].includes(entry.status))
  )
    return true;

  // A waiting sibling cannot run while this workflow holds its concurrency group.
  const current = run(options.api.read(`${base}/actions/runs/${identifier(options.runId)}`));
  if (
    current.id !== options.runId ||
    !isLifecycleRun(current) ||
    current.event !== options.eventName ||
    current.status !== "in_progress"
  )
    return true;
  const workflowId = object(current).workflow_id;
  return (
    typeof workflowId !== "number" ||
    !Number.isSafeInteger(workflowId) ||
    workflowId <= 0 ||
    !running.every((entry) => object(entry).workflow_id === workflowId)
  );
}

/** @param {Options} options @param {Policy} rules @param {string} base */
function context(options, rules, base) {
  const meta = object(options.api.read(base));
  if (
    meta.full_name !== rules.repository ||
    meta.default_branch !== rules.defaultBranch ||
    options.repository !== rules.repository
  )
    throw new Error("Repository/default-branch identity mismatch");
  const head = currentHead(options, base, rules);
  if (options.checkoutSha !== head)
    throw new Error("Cleanup must execute the current trusted default-branch checkout");
  if (["push", "workflow_dispatch"].includes(options.eventName)) {
    producerContext(options, rules, base, head);
    return { head, producer: true };
  }
  if (options.eventName === "pull_request_target") {
    if (options.event.action !== "closed") throw new Error("Cleanup accepts only closed PR events");
    identifier(object(options.event.pull_request).number);
    return { head, producer: false };
  }
  if (options.eventName !== "workflow_run" || options.event.action !== "completed")
    throw new Error("Unsupported cleanup event");
  const eventRun = object(options.event.workflow_run);
  const triggering = run(options.api.read(`${base}/actions/runs/${identifier(eventRun.id)}`));
  if (triggering.status !== "completed") throw new Error("Triggering run is still active");
  return { head, producer: false };
}

/** @param {Options} options @param {Policy} rules @param {string} base @param {string} head */
function producerContext(options, rules, base, head) {
  const source = run(options.api.read(`${base}/actions/runs/${identifier(options.runId)}`));
  const producer = rules.producerWorkflows.find(
    (w) => w.name === source.name && w.path === source.path.split("@")[0],
  );
  if (
    source.id !== options.runId ||
    options.ref !== `refs/heads/${rules.defaultBranch}` ||
    options.sha !== head ||
    !producer ||
    producer.name !== options.workflow ||
    source.head_sha !== head ||
    source.head_branch !== rules.defaultBranch ||
    source.event !== options.eventName
  ) {
    throw new Error("Untrusted producer context");
  }
  if (!successfulWarmJob(options.api, base, source, producer.job)) {
    throw new Error("Successful producer job has not been confirmed");
  }
}

/** @param {Api} api @param {string} base @param {number} number */
function pullRequest(api, base, number) {
  const value = object(api.read(`${base}/pulls/${identifier(number)}`));
  if (value.state !== "open" && value.state !== "closed") throw new Error("Unknown PR state");
  const head = object(value.head);
  return { state: value.state, sha: text(head.sha), branch: text(head.ref) };
}

/** @param {string} ref */
function pullRequestNumber(ref) {
  const match = /^refs\/pull\/(\d+)\/(?:merge|head)$/.exec(ref);
  return match ? identifier(Number(match[1])) : undefined;
}

/** @param {number[]} ids @param {number} limit @param {number} runNumber */
function verificationWindow(ids, limit, runNumber) {
  if (ids.length <= limit) return ids;
  const start = ((runNumber - 1) % Math.ceil(ids.length / limit)) * limit;
  return ids.slice(start, start + limit);
}

/** @param {Options} options @param {string} base @param {import('./types').Run[]} active */
function closedWithoutActiveRun(options, base, active) {
  /** @param {number} number */
  return (number) => {
    const pr = pullRequest(options.api, base, number);
    return (
      pr.state === "closed" &&
      !active.some(
        (r) =>
          r.head_sha === pr.sha ||
          r.head_branch === pr.branch ||
          r.pull_requests?.some((q) => q.number === number),
      )
    );
  };
}

/** @param {Cache[]} caches @param {Options} options @param {string} base @param {import('./types').Run[]} active */
function planPullRequests(caches, options, base, active) {
  const numbers = caches.map((c) => pullRequestNumber(c.ref));
  const ids = [...new Set(numbers.filter((number) => number !== undefined))].sort((a, b) => a - b);
  const current =
    options.eventName === "pull_request_target"
      ? identifier(object(options.event.pull_request).number)
      : undefined;
  const prioritize = current !== undefined && ids.includes(current);
  const selected = new Set(
    verificationWindow(
      prioritize ? ids.filter((id) => id !== current) : ids,
      prioritize ? pullRequestLimit - 1 : pullRequestLimit,
      options.runNumber,
    ),
  );
  if (prioritize) selected.add(current);
  const eligible = new Set([...selected].filter(closedWithoutActiveRun(options, base, active)));
  const candidates = caches.flatMap((cache, index) => {
    const number = numbers[index];
    return number !== undefined && eligible.has(number)
      ? [{ cache, reason: "closed PR without active runs" }]
      : [];
  });
  return { candidates, unverified: ids.length - selected.size };
}

/** @param {Cache[]} caches @param {Options} options @param {string} head @param {string} base */
function planCodeql(caches, options, head, base) {
  const ids = [
    ...new Set(
      caches
        .filter(
          (c) => c.ref === `refs/heads/${options.policy.defaultBranch}` && c.size_in_bytes > 0,
        )
        .map(codeqlIdentity)
        .filter((c) => c?.sha === head)
        .map((c) => identifier(c?.runId)),
    ),
  ].sort((a, b) => b - a);
  const selected = verificationWindow(ids, codeqlProofLimit, options.runNumber);
  const proofs = selected.map((id) => run(options.api.read(`${base}/actions/runs/${id}`)));
  // An in-window proof can retire only older caches; any newer unchecked snapshot stays.
  return {
    candidates: codeql(caches, proofs, options.policy, head),
    unverified: ids.length - selected.length,
  };
}

/** @param {Cache} expected @param {Cache[]} fresh */
function unchangedCache(expected, fresh) {
  const current = fresh.find(({ id }) => id === expected.id);
  return (
    current?.key === expected.key &&
    current.ref === expected.ref &&
    current.version === expected.version &&
    current.last_accessed_at === expected.last_accessed_at
  );
}

/** @param {Candidate[]} candidates @param {Cache[]} fresh @param {Options} options @param {string} base @param {import('./types').Run[]} running */
function selectPullRequestBatch(candidates, fresh, options, base, running) {
  const recheck = closedWithoutActiveRun(options, base, running);
  let remainingPrChecks = pullRequestLimit;
  /** @type {Candidate[]} */
  const batch = [];
  for (const candidate of candidates) {
    const number = pullRequestNumber(candidate.cache.ref);
    if (number === undefined || !unchangedCache(candidate.cache, fresh)) continue;
    remainingPrChecks -= 1;
    if (recheck(number)) batch.push(candidate);
    if (remainingPrChecks === 0 || batch.length === deletionLimit) break;
  }
  return batch;
}

/** @param {Options} options @param {string} base @param {Policy} rules */
function currentHead(options, base, rules) {
  const ref = object(
    options.api.read(`${base}/git/ref/heads/${encodeURIComponent(rules.defaultBranch)}`),
  );
  return text(object(ref.object).sha);
}

/** @param {Options} options @param {string} base @param {{head:string, producer:boolean}} source */
function mainReceipts(options, base, { head, producer }) {
  if (!producer) return recoverReceipts(options, options.policy, base, head);
  producerContext(options, options.policy, base, head);
  return options.replacements;
}

/** @param {Candidate[]} batch @param {Cache[]} fresh @param {Options} options @param {string} base @param {{head:string, producer:boolean}} source */
function recheckReplacements(batch, fresh, options, base, source) {
  const codeqlIds = new Set(
    batch.flatMap(({ replacement }) => {
      const identity = replacement && codeqlIdentity(replacement);
      return identity ? [identifier(identity.runId)] : [];
    }),
  );
  const proofs = [...codeqlIds].map((id) => run(options.api.read(`${base}/actions/runs/${id}`)));
  const verified = codeql(fresh, proofs, options.policy, source.head);
  if (batch.some(({ replacement }) => replacement && !codeqlIdentity(replacement))) {
    verified.push(...replacements(fresh, mainReceipts(options, base, source), options.policy));
  }
  return batch.filter(
    ({ cache, replacement }) =>
      replacement &&
      verified.some(
        (item) =>
          item.cache.id === cache.id &&
          item.replacement?.id === replacement.id &&
          item.replacement.key === replacement.key &&
          item.replacement.ref === replacement.ref &&
          item.replacement.version === replacement.version,
      ),
  );
}

/** @param {Candidate[]} batch @param {Options} options */
function processBatch(batch, options) {
  return batch.map(({ cache, reason }) => {
    if (!options.dryRun) options.api.remove(cache.id);
    return { id: cache.id, bytes: cache.size_in_bytes, reason };
  });
}

/** @param {Candidate[]} candidates @param {number} capacity @param {Options} options @param {string} base @param {{head:string, producer:boolean}} source */
function processMainBatches(candidates, capacity, options, base, source) {
  let pending = candidates;
  const deleted = [];
  let activeCount;
  for (let budget = capacity; budget > 0 && pending.length; budget -= mainBatchLimit) {
    const fresh = inventory(options.api, base);
    pending = pending.filter(({ cache }) => unchangedCache(cache, fresh));
    const batch = pending.slice(0, Math.min(mainBatchLimit, budget));
    if (!batch.length) break;
    const verified = recheckReplacements(batch, fresh, options, base, source);
    const running = activeRuns(options.api, base, options.runId);
    activeCount = running.length;
    if (
      blocksMainRotation(options, base, running) ||
      currentHead(options, base, options.policy) !== source.head
    )
      break;
    deleted.push(...processBatch(verified, options));
    pending = pending.slice(batch.length);
  }
  return { deleted, activeCount };
}

/** @param {Options} options @param {Policy} rules @param {string} base @param {string} head */
function readOptionalNpmReceipts(options, rules, base, head) {
  try {
    return recoverReceipts(options, rules, base, head);
  } catch {
    console.warn("Npm replacement receipts could not be verified; deferring npm cache rotation");
    return [];
  }
}

/** @param {Options} options */
function runLifecycle(options) {
  identifier(options.runNumber);
  const rules = policy(options.policy);
  const base = `repos/${rules.repository}`;
  const source = context(options, rules, base);
  const { head, producer } = source;
  const caches = inventory(options.api, base);
  const active = activeRuns(options.api, base, options.runId);
  const prs = planPullRequests(caches, options, base, active);
  const receipts = producer
    ? options.replacements
    : readOptionalNpmReceipts(options, rules, base, head);
  const codeql = planCodeql(caches, options, head, base);
  /** @type {Candidate[]} */
  const candidates = [
    ...prs.candidates,
    ...replacements(caches, receipts, rules),
    ...codeql.candidates,
  ];
  const unique = [...new Map(candidates.map((c) => [c.cache.id, c])).values()];
  const fresh = inventory(options.api, base);
  if (currentHead(options, base, rules) !== head)
    throw new Error("Default branch changed during planning; no caches deleted");
  const running = activeRuns(options.api, base, options.runId);
  const prBatch = selectPullRequestBatch(
    unique.filter((candidate) => !candidate.replacement),
    fresh,
    options,
    base,
    running,
  );
  const deleted = processBatch(prBatch, options);
  const main = processMainBatches(
    unique.filter((candidate) => candidate.replacement),
    deletionLimit - deleted.length,
    options,
    base,
    source,
  );
  deleted.push(...main.deleted);
  const remaining = inventory(options.api, base);
  if (!options.dryRun && deleted.some((c) => remaining.some((r) => r.id === c.id)))
    throw new Error("Cache deletion readback failed");
  return {
    dryRun: Boolean(options.dryRun),
    deleted,
    deferred: unique.length - deleted.length,
    unverifiedPullRequests: prs.unverified,
    unverifiedCodeqlRuns: codeql.unverified,
    activeRuns: main.activeCount ?? running.length,
    remainingCount: remaining.length,
    remainingBytes: remaining.reduce((sum, c) => sum + c.size_in_bytes, 0),
  };
}

module.exports = { runLifecycle };
