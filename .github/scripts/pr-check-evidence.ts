import { appendFileSync, readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import type { CiRevisions } from './plan-ci.ts';

const sha = /^[a-f0-9]{40}$/;
const maxCandidateRuns = 5;
const lookupLimits = {
  ci: { checks: 20, requests: 24 },
  gitleaks: { checks: 5, requests: 9 },
} as const;
const workflows = { ci: 'CI', gitleaks: 'gitleaks' } as const;
const activeStatuses = new Set(['queued', 'requested', 'pending', 'in_progress']);
type Workflow = keyof typeof workflows;
type ReadEvidence = (path: string) => Promise<unknown>;

interface Run {
  id: number;
  run_number: number;
  run_attempt: number;
  workflow_id: number;
  head_sha: string;
  event: string;
  path: string;
  display_title: string;
  status: string;
  conclusion: string | null;
  repository: { full_name: string };
  pull_requests: Array<{
    number: number;
    head: { sha: string };
    base: { sha: string; ref: string };
  }>;
}

interface Job {
  name: string;
  status: string;
  conclusion: string | null;
  steps?: Array<{ name: string; conclusion: string | null; completed_at: string }>;
}

interface EvidenceRequest {
  workflow: Workflow;
  repository: string;
  pullRequest: number;
  revisions: CiRevisions;
  runId: number;
  runNumber: number;
}

export function isTextOnlyEdit(
  event: unknown,
): event is { action: 'edited'; changes: object; number?: unknown } {
  if (event === null || typeof event !== 'object' || !('action' in event)) return false;
  if (event.action !== 'edited' || !('changes' in event)) return false;
  const changes = event.changes;
  if (!changes || typeof changes !== 'object') return false;
  const fields = Object.entries(changes);
  return (
    fields.length > 0 &&
    fields.every(([key, value]) => {
      if (key !== 'title' && key !== 'body') return false;
      if (!value || typeof value !== 'object' || !('from' in value)) return false;
      return typeof value.from === 'string' || (key === 'body' && value.from === null);
    })
  );
}

export function canReuseCheckEvidence(
  event: unknown,
  env: Pick<NodeJS.ProcessEnv, 'GITHUB_EVENT_NAME' | 'GITHUB_RUN_ATTEMPT'> = {
    GITHUB_EVENT_NAME: process.env.GITHUB_EVENT_NAME,
    GITHUB_RUN_ATTEMPT: process.env.GITHUB_RUN_ATTEMPT,
  },
): event is { number?: unknown } {
  return (
    env.GITHUB_EVENT_NAME === 'pull_request' &&
    env.GITHUB_RUN_ATTEMPT === '1' &&
    isTextOnlyEdit(event)
  );
}

function isPositiveInteger(value: number) {
  return Number.isSafeInteger(value) && value > 0;
}

export async function hasCheckEvidence(
  request: EvidenceRequest,
  get: ReadEvidence,
  wait: (milliseconds: number) => Promise<void> = delay,
) {
  const { workflow, revisions, pullRequest, runId, runNumber } = request;
  if (
    !Object.values(revisions).every((value) => sha.test(value)) ||
    ![pullRequest, runId, runNumber].every(isPositiveInteger)
  ) {
    return false;
  }

  const identity = `${revisions.base} ${revisions.head} ${revisions.merge}`;
  const { checks, requests } = lookupLimits[workflow];
  let remainingRequests: number = requests;
  const boundedGet: ReadEvidence = (path) => {
    if (remainingRequests === 0) throw new Error('Evidence lookup request limit reached.');
    remainingRequests--;
    return get(path);
  };
  try {
    for (let check = 0; check < checks; check++) {
      const result = await findCheckEvidence(request, identity, boundedGet);
      if (result === 'verified') return true;
      if (result === 'missing' && check === 0) await wait(2000);
      else if (result === 'active' && check + 1 < checks) await wait(15_000);
      else return false;
    }
  } catch {
    // Missing, malformed or inaccessible evidence requires a regular check.
  }
  return false;
}

function matchesWorkflow(run: Run, request: EvidenceRequest) {
  const { workflow, repository, revisions } = request;
  return (
    run.event === 'pull_request' &&
    run.repository?.full_name === repository &&
    run.path.split('@', 1)[0] === `.github/workflows/${workflow}.yml` &&
    run.head_sha === revisions.head &&
    [run.id, run.run_number, run.run_attempt, run.workflow_id].every(isPositiveInteger)
  );
}

function matchesPullRequest(run: Run, request: EvidenceRequest) {
  const { pullRequest, revisions } = request;
  return (
    matchesWorkflow(run, request) &&
    Array.isArray(run.pull_requests) &&
    run.pull_requests.some(
      ({ number, base, head }) =>
        number === pullRequest &&
        base.ref === 'main' &&
        base.sha === revisions.base &&
        head.sha === revisions.head,
    )
  );
}

function isCompleteRunPage(runs: Run[], count: number) {
  return (
    Array.isArray(runs) &&
    count === runs.length &&
    runs.length <= maxCandidateRuns &&
    new Set(runs.map((run) => run.id)).size === runs.length &&
    new Set(runs.map((run) => run.run_number)).size === runs.length &&
    new Set(runs.map((run) => run.workflow_id)).size <= 1
  );
}

function classifyRun(run: Run, request: EvidenceRequest) {
  const { runId, runNumber, pullRequest } = request;
  if (run.id === runId || run.run_number === runNumber) {
    return run.id === runId && run.run_number === runNumber ? 'skip' : 'unverified';
  }
  // Missing PR ownership may hide newer negative evidence for this revision.
  if (!Array.isArray(run.pull_requests) || run.pull_requests.length === 0) return 'unverified';
  if (
    run.pull_requests.every(({ number }) => isPositiveInteger(number) && number !== pullRequest)
  ) {
    const namedPr = /^(?:Check|Metadata) PR (\d+) revisions /.exec(run.display_title)?.[1];
    return namedPr === String(pullRequest) ? 'unverified' : 'skip';
  }
  return matchesPullRequest(run, request) ? 'candidate' : 'unverified';
}

async function findCheckEvidence(request: EvidenceRequest, identity: string, get: ReadEvidence) {
  const { workflow, revisions, pullRequest } = request;
  const filters = `event=pull_request&head_sha=${revisions.head}&per_page=${maxCandidateRuns}`;
  const { workflow_runs: runs, total_count: count } = (await get(
    `workflows/${workflow}.yml/runs?${filters}`,
  )) as {
    workflow_runs: Run[];
    total_count: number;
  };
  if (!isCompleteRunPage(runs, count) || !runs.every((run) => matchesWorkflow(run, request))) {
    return 'unverified';
  }

  const codeRunName = `Check PR ${pullRequest} revisions ${identity}`;
  const metadataRunName = `Metadata PR ${pullRequest} revisions ${identity}`;
  const candidates = [...runs].sort((left, right) => right.run_number - left.run_number);

  for (const run of candidates) {
    const disposition = classifyRun(run, request);
    if (disposition === 'skip') continue;
    if (disposition === 'unverified') return 'unverified';
    const isCodeRun = run.display_title === codeRunName;
    if (isCodeRun && activeStatuses.has(run.status) && run.conclusion === null) return 'active';
    if (run.status !== 'completed' || run.conclusion !== 'success') return 'unverified';
    if (!isCodeRun && run.display_title !== metadataRunName) return 'unverified';
    const marker = `${isCodeRun ? 'Verified' : 'Reused'} PR revisions ${identity}`;
    if (!(await inspectRun(run, request, marker, get))) return 'unverified';
    if (isCodeRun) return 'verified';
  }
  return 'missing';
}

async function inspectRun(run: Run, request: EvidenceRequest, marker: string, get: ReadEvidence) {
  const { jobs, total_count: count } = (await get(
    `runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100`,
  )) as {
    jobs: Job[];
    total_count: number;
  };
  if (!Array.isArray(jobs) || count !== jobs.length || jobs.length > 100) return false;
  const required = jobs.filter((job) => job.name === workflows[request.workflow]);
  const job = required[0];
  if (required.length !== 1 || job?.status !== 'completed' || job.conclusion !== 'success') {
    return false;
  }
  const steps = job.steps?.filter((step) => step.conclusion === 'success') ?? [];
  if (!steps.some((step) => step.name === marker && isFresh(step))) return false;
  const latest = (await get(`runs/${run.id}`)) as Run;
  return (
    latest.id === run.id &&
    latest.workflow_id === run.workflow_id &&
    latest.run_number === run.run_number &&
    latest.run_attempt === run.run_attempt &&
    latest.display_title === run.display_title &&
    latest.status === 'completed' &&
    latest.conclusion === 'success' &&
    matchesPullRequest(latest, request)
  );
}

function isFresh(step: { completed_at: string }) {
  const age = Date.now() - Date.parse(step.completed_at);
  return age >= 0 && age < 7 * 24 * 60 * 60 * 1000;
}

export function readEvent(): unknown {
  const path = process.env.GITHUB_EVENT_PATH;
  if (!path) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

export async function reusableCheck(workflow: Workflow, revisions: CiRevisions) {
  const repository = process.env.GITHUB_REPOSITORY ?? '';
  const event = readEvent();
  if (
    !canReuseCheckEvidence(event) ||
    typeof event.number !== 'number' ||
    !/^[\w.-]+\/[\w.-]+$/.test(repository)
  ) {
    return false;
  }
  return hasCheckEvidence(
    {
      workflow,
      repository,
      pullRequest: event.number,
      revisions,
      runId: Number(process.env.GITHUB_RUN_ID),
      runNumber: Number(process.env.GITHUB_RUN_NUMBER),
    },
    async (path) => {
      const response = await fetch(`https://api.github.com/repos/${repository}/actions/${path}`, {
        headers: { Accept: 'application/vnd.github+json', 'Cache-Control': 'no-cache' },
        cache: 'no-cache',
        redirect: 'error',
        signal: AbortSignal.timeout(3000),
      });
      const age = response.headers.get('Age');
      const received = Date.now() - Date.parse(response.headers.get('Date') ?? '');
      if (response.status !== 200 || age !== null || !(Math.abs(received) < 15_000)) {
        throw new Error('Fresh required check evidence is unavailable.');
      }
      return response.json();
    },
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const reused = await reusableCheck('gitleaks', {
    base: process.env.CHANGE_BASE_SHA ?? '',
    head: process.env.CHANGE_HEAD_SHA ?? '',
    merge: process.env.CHANGE_MERGE_SHA ?? '',
  });
  const output = process.env.GITHUB_OUTPUT;
  if (!output) throw new Error('Required check evidence needs a workflow output.');
  appendFileSync(output, `reused=${reused}\n`);
}
