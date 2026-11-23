import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import type { CiRevisions } from './plan-ci.ts';

const sha = /^[a-f0-9]{40}$/;
const maxCandidateRuns = 5;
const workflows = { ci: 'CI', gitleaks: 'gitleaks' } as const;
type Workflow = keyof typeof workflows;

interface Run {
  id: number;
  run_number: number;
  run_attempt: number;
  head_sha: string;
  event: string;
  path: string;
  conclusion: string | null;
}

interface Job {
  name: string;
  conclusion: string | null;
  steps?: Array<{ name: string; conclusion: string | null; completed_at: string }>;
}

interface EvidenceRequest {
  workflow: Workflow;
  revisions: CiRevisions;
  runNumber: number;
}

export function isTextOnlyEdit(event: unknown) {
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

function isPositiveInteger(value: number) {
  return Number.isSafeInteger(value) && value > 0;
}

export async function hasCheckEvidence(
  { workflow, revisions, runNumber }: EvidenceRequest,
  get: (path: string) => Promise<unknown>,
) {
  if (!Object.values(revisions).every((value) => sha.test(value))) return false;
  if (!isPositiveInteger(runNumber)) return false;

  const identity = `${revisions.base} ${revisions.head} ${revisions.merge}`;
  const filters = `event=pull_request&head_sha=${revisions.head}&per_page=${maxCandidateRuns}`;
  try {
    const { workflow_runs: runs } = (await get(`workflows/${workflow}.yml/runs?${filters}`)) as {
      workflow_runs: Run[];
    };
    if (runs.length > maxCandidateRuns || !runs.every((run) => isPositiveInteger(run.run_number))) {
      return false;
    }
    const earlier = runs
      .filter((run) => run.run_number < runNumber)
      .sort((left, right) => right.run_number - left.run_number);
    for (const run of earlier) {
      const result = await inspectRun(run, workflow, revisions.head, identity, get);
      if (result !== 'reused') return result === 'verified';
    }
  } catch {
    // Missing, malformed or inaccessible evidence requires a regular check.
  }
  return false;
}

async function inspectRun(
  run: Run,
  workflow: Workflow,
  head: string,
  identity: string,
  get: (path: string) => Promise<unknown>,
) {
  if (
    run.conclusion !== 'success' ||
    run.event !== 'pull_request' ||
    run.path.split('@', 1)[0] !== `.github/workflows/${workflow}.yml` ||
    run.head_sha !== head ||
    ![run.id, run.run_number, run.run_attempt].every(isPositiveInteger)
  ) {
    return 'unverified';
  }

  const { jobs } = (await get(`runs/${run.id}/attempts/${run.run_attempt}/jobs`)) as {
    jobs: Job[];
  };
  const required = jobs.filter((job) => job.name === workflows[workflow]);
  if (required.length !== 1 || required[0]?.conclusion !== 'success') return 'unverified';
  const steps = required[0].steps?.filter((step) => step.conclusion === 'success') ?? [];
  if (steps.some((step) => step.name === `Verified PR revisions ${identity}` && isFresh(step))) {
    return 'verified';
  }
  if (steps.some((step) => step.name === `Reused PR revisions ${identity}` && isFresh(step))) {
    return 'reused';
  }
  return 'unverified';
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
  if (!isTextOnlyEdit(readEvent()) || !/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    return false;
  }
  return hasCheckEvidence(
    { workflow, revisions, runNumber: Number(process.env.GITHUB_RUN_NUMBER) },
    async (path) => {
      const response = await fetch(`https://api.github.com/repos/${repository}/actions/${path}`, {
        headers: { Accept: 'application/vnd.github+json' },
        redirect: 'error',
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) throw new Error('Required check evidence is unavailable.');
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
