import { expect, it, vi } from 'vitest';
import { ciPlanVersion } from '../../../.github/scripts/plan-ci.ts';
import {
  canReuseCheckEvidence,
  hasCheckEvidence as readCheckEvidence,
} from '../../../.github/scripts/pr-check-evidence.ts';
import { validateResults } from '../../../.github/scripts/validate-ci.ts';

const revisions = { base: 'a'.repeat(40), head: 'b'.repeat(40), merge: 'c'.repeat(40) };
const identity = `${revisions.base} ${revisions.head} ${revisions.merge}`;
const repository = 'boommasterxd/ml-teaching';
const pullRequest = 120;
const request = {
  workflow: 'ci',
  repository,
  pullRequest,
  revisions,
  runId: 3,
  runNumber: 3,
} as const;
const codeTitle = `Check PR ${pullRequest} revisions ${identity}`;
const verified = `Verified PR revisions ${identity}`;

function run(number: number, conclusion: string | null = 'success') {
  return {
    id: number,
    run_number: number,
    run_attempt: 2,
    workflow_id: 88,
    status: 'completed',
    conclusion,
    head_sha: revisions.head,
    event: 'pull_request',
    path: '.github/workflows/ci.yml@main',
    display_title: codeTitle,
    repository: { full_name: repository },
    pull_requests: [
      {
        number: pullRequest,
        base: { ref: 'main', sha: revisions.base },
        head: { sha: revisions.head },
      },
    ],
  };
}

function jobs(names: string | string[], completedAt = new Date().toISOString(), check = 'CI') {
  return {
    jobs: [
      {
        name: check,
        status: 'completed',
        conclusion: 'success',
        steps: [names].flat().map((name) => ({
          name,
          conclusion: 'success',
          completed_at: completedAt,
        })),
      },
    ],
  };
}

function hasCheckEvidence(
  request: Parameters<typeof readCheckEvidence>[0],
  get: Parameters<typeof readCheckEvidence>[1],
) {
  return readCheckEvidence(request, async (path) => {
    const response = await get(path);
    if (!response || typeof response !== 'object' || 'total_count' in response) return response;
    if ('workflow_runs' in response && Array.isArray(response.workflow_runs)) {
      return { total_count: response.workflow_runs.length, ...response };
    }
    if ('jobs' in response && Array.isArray(response.jobs)) {
      return { total_count: response.jobs.length, ...response };
    }
    return response;
  });
}

it('only accepts a reused CI plan on the first attempt of a text-only PR edit', () => {
  const plan = { version: ciPlanVersion, ...revisions, reason: 'verified-revision', tests: [] };
  const results = { plan: 'success', quality: 'skipped' };
  const changes = { title: { from: 'Original title' } };
  const edited = { action: 'edited', changes };
  const firstAttempt = { GITHUB_EVENT_NAME: 'pull_request', GITHUB_RUN_ATTEMPT: '1' };
  const rerun = { ...firstAttempt, GITHUB_RUN_ATTEMPT: '2' };
  const changedBase = { ...edited, changes: { ...changes, base: { from: 'old' } } };
  expect(() =>
    validateResults(plan, revisions, results, canReuseCheckEvidence(edited, firstAttempt)),
  ).not.toThrow();
  expect(() =>
    validateResults(plan, revisions, results, canReuseCheckEvidence(edited, rerun)),
  ).toThrow(/first attempt/);
  expect(() =>
    validateResults(plan, revisions, results, canReuseCheckEvidence(changedBase, firstAttempt)),
  ).toThrow(/text-only/);
});

it('only reuses Gitleaks evidence from the required scanner job', async () => {
  const completed = {
    ...run(4),
    path: '.github/workflows/gitleaks.yml',
    display_title: codeTitle,
  };
  const scanner = { ...request, workflow: 'gitleaks' } as const;
  const get = vi
    .fn<(path: string) => Promise<unknown>>()
    .mockResolvedValueOnce({ workflow_runs: [completed] })
    .mockResolvedValueOnce(jobs(verified))
    .mockResolvedValueOnce({ workflow_runs: [completed] })
    .mockResolvedValueOnce(jobs(verified, undefined, 'gitleaks'))
    .mockResolvedValueOnce(completed)
    .mockResolvedValueOnce({ workflow_runs: [completed] });

  await expect(hasCheckEvidence(scanner, get)).resolves.toBe(false);
  await expect(hasCheckEvidence(scanner, get)).resolves.toBe(true);
});

it('does not reuse a successful job from a superseded attempt', async () => {
  const get = vi
    .fn<(path: string) => Promise<unknown>>()
    .mockResolvedValueOnce({ workflow_runs: [run(2)] })
    .mockResolvedValueOnce(jobs(verified))
    .mockResolvedValueOnce({ ...run(2, null), run_attempt: 3, status: 'in_progress' });

  await expect(hasCheckEvidence(request, get)).resolves.toBe(false);
});

it('runs checks again when a newer attempt failed, data is inaccessible, or the merge differs', async () => {
  const get = vi
    .fn<(path: string) => Promise<unknown>>()
    .mockRejectedValueOnce(new Error('Unavailable'))
    .mockResolvedValueOnce({ workflow_runs: [run(2, 'failure'), run(1)] })
    .mockResolvedValueOnce({ workflow_runs: [run(2)] })
    .mockResolvedValueOnce(jobs(verified.replace(revisions.merge, 'd'.repeat(40))));

  await expect(hasCheckEvidence(request, get)).resolves.toBe(false);
  await expect(hasCheckEvidence(request, get)).resolves.toBe(false);
  await expect(hasCheckEvidence(request, get)).resolves.toBe(false);
});
