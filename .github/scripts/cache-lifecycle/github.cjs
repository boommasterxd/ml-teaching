"use strict";

const { execFileSync } = require("node:child_process");
const { identifier, object } = require("./planner.cjs");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const workflowRunFilters = [
  "actor",
  "branch",
  "check_suite_id",
  "created",
  "event",
  "head_sha",
  "status",
];
const cliFailures = new Map([
  ["ENOENT", "CLI unavailable"],
  ["ETIMEDOUT", "timeout"],
  ["ENOBUFS", "output limit exceeded"],
]);
/** @typedef {"read metadata" | "list inventory" | "delete cache" | "download producer receipts"} Operation */
/** @typedef {(operation: Operation, args: string[]) => string} Invoke */

/** @param {string[]} args @returns {string} */
function runGh(args) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 16 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/** @param {string} output @param {Operation} operation @returns {unknown} */
function parseJson(output, operation) {
  try {
    return JSON.parse(output);
  } catch {
    throw new Error(`GitHub ${operation} failed (invalid JSON)`);
  }
}

/** @param {string} endpoint */
function hasWorkflowRunFilters(endpoint) {
  const separator = endpoint.indexOf("?");
  if (separator === -1) return false;
  const query = new URLSearchParams(endpoint.slice(separator + 1));
  return workflowRunFilters.some((filter) => query.has(filter));
}

/** @param {unknown} pages @param {string} field @param {string} endpoint */
function completeInventory(pages, field, endpoint) {
  if (!Array.isArray(pages) || pages.length === 0 || pages.length > 50)
    throw new Error("GitHub list inventory failed (invalid page count)");
  const total = object(pages[0]).total_count;
  if (!Number.isSafeInteger(total) || Number(total) < 0)
    throw new Error("GitHub list inventory failed (invalid total count)");
  // Filtered workflow-run searches can report only the first 1,000 matches.
  if (field === "workflow_runs" && Number(total) >= 1000 && hasWorkflowRunFilters(endpoint))
    throw new Error("GitHub list inventory failed (workflow run search limit reached)");

  const ids = new Set();
  const rows = pages.flatMap((raw) => {
    const page = object(raw);
    const items = page[field];
    if (page.total_count !== total || !Array.isArray(items))
      throw new Error("GitHub list inventory failed (inconsistent page)");
    for (const item of items) {
      const id = identifier(object(item).id);
      if (ids.has(id)) throw new Error("GitHub list inventory failed (duplicate ID)");
      ids.add(id);
    }
    return items;
  });
  if (rows.length !== total) throw new Error("GitHub list inventory failed (incomplete row count)");
  return rows;
}

/** @param {string} repository @param {(args: string[]) => string} [runCommand] @returns {import('./types').Api} */
function createGhApi(repository, runCommand = runGh) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error("Invalid repository");
  const base = `repos/${repository}/`;
  /** @type {Invoke} */
  const invoke = (operation, args) => {
    try {
      return runCommand(args);
    } catch (error) {
      const code = /** @type {NodeJS.ErrnoException} */ (error)?.code;
      const reason = cliFailures.get(code ?? "") ?? "command failed";
      throw new Error(`GitHub ${operation} failed (${reason})`);
    }
  };
  /** @param {Operation} operation @param {string} endpoint @param {string[]} flags */
  const request = (operation, endpoint, flags) => {
    if (
      (endpoint !== base.slice(0, -1) && !endpoint.startsWith(base)) ||
      /[\r\n\0]/.test(endpoint)
    ) {
      throw new Error(`GitHub ${operation} failed (request outside target repository)`);
    }
    return invoke(operation, ["api", "-H", "X-GitHub-Api-Version: 2026-03-10", ...flags, endpoint]);
  };
  /** @type {import('./types').Api} */
  const api = {
    read: (endpoint) =>
      parseJson(request("read metadata", endpoint, ["--method", "GET"]), "read metadata"),
    list: (endpoint, field) => {
      const output = request("list inventory", endpoint, [
        "--method",
        "GET",
        "--paginate",
        "--slurp",
      ]);
      return completeInventory(parseJson(output, "list inventory"), field, endpoint);
    },
    remove: (id) => {
      request("delete cache", `${base}actions/caches/${identifier(id)}`, ["--method", "DELETE"]);
    },
    readReceipts: (runId, attempt) => downloadReceipts(api, repository, runId, attempt, invoke),
  };
  return api;
}

/** @template T @param {() => T} action @param {string} reason @returns {T} */
function receiptStorage(action, reason) {
  try {
    return action();
  } catch {
    throw new Error(`GitHub download producer receipts failed (${reason})`);
  }
}

/** @param {import('./types').Api} api @param {string} repository @param {number} runId @param {number} attempt @param {Invoke} invoke */
function downloadReceipts(api, repository, runId, attempt, invoke) {
  const name = `cache-lifecycle-receipts-${identifier(attempt)}`;
  const artifacts = api
    .list(
      `repos/${repository}/actions/runs/${identifier(runId)}/artifacts?per_page=100`,
      "artifacts",
    )
    .map((item) => /** @type {Record<string, unknown>} */ (item))
    .filter((item) => item.name === name);
  if (!artifacts.length) return [];
  if (
    artifacts.length !== 1 ||
    typeof artifacts[0].expired !== "boolean" ||
    !Number.isSafeInteger(artifacts[0].size_in_bytes) ||
    Number(artifacts[0].size_in_bytes) > 131072
  ) {
    throw new Error("Invalid or ambiguous producer receipt artifact");
  }
  if (artifacts[0].expired) return [];
  const directory = receiptStorage(
    () => fs.mkdtempSync(path.join(os.tmpdir(), "cache-lifecycle-receipts-")),
    "temporary directory unavailable",
  );
  try {
    invoke("download producer receipts", [
      "run",
      "download",
      String(runId),
      "--name",
      name,
      "--dir",
      directory,
      "--repo",
      repository,
    ]);
    const file = path.join(directory, "replacements.json");
    const size = receiptStorage(() => fs.statSync(file).size, "receipt file unavailable");
    if (size > 65536) throw new Error("Producer receipt exceeds size budget");
    const output = receiptStorage(() => fs.readFileSync(file, "utf8"), "receipt file unreadable");
    const value = parseJson(output, "download producer receipts");
    if (!Array.isArray(value) || value.length > 20) throw new Error("Invalid producer receipts");
    return value;
  } finally {
    receiptStorage(
      () => fs.rmSync(directory, { recursive: true, force: true }),
      "temporary directory cleanup failed",
    );
  }
}

module.exports = { createGhApi };
