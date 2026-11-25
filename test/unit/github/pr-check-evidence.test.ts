import { mkdtempDisposableSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { ciPlanVersion } from '../../../.github/scripts/plan-ci.ts';
import {
  canReuseCheckEvidence,
  hasCheckEvidence as readCheckEvidence,
  isTextOnlyEdit,
  reusableCheck,
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
const metadataTitle = `Metadata PR ${pullRequest} revisions ${identity}`;
const verified = `Verified PR revisions ${identity}`;
const reused = `Reused PR revisions ${identity}`;

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

function jobs(name: string, completedAt = new Date().toISOString(), check = 'CI') {
  return {
    jobs: [
      {
        name: check,
        status: 'completed',
        conclusion: 'success',
        steps: [{ name, conclusion: 'success', completed_at: completedAt }],
      },
    ],
  };
}

function hasCheckEvidence(
  request: Parameters<typeof readCheckEvidence>[0],
  get: Parameters<typeof readCheckEvidence>[1],
  wait?: Parameters<typeof readCheckEvidence>[2],
) {
  return readCheckEvidence(
    request,
    async (path) => {
      const response = await get(path);
      if (!response || typeof response !== 'object' || 'total_count' in response) return response;
      if ('workflow_runs' in response && Array.isArray(response.workflow_runs)) {
        return { total_count: response.workflow_runs.length, ...response };
      }
      if ('jobs' in response && Array.isArray(response.jobs)) {
        return { total_count: response.jobs.length, ...response };
      }
      return response;
    },
    wait,
  );
}

describe('required checks after a pull request edit', () => {
  it('permits lookup for text edits and retains regular checks on a base change', () => {
    const changes = { title: { from: 'Documentation update' }, body: { from: '' } };
    expect(isTextOnlyEdit({ action: 'edited', changes })).toBe(true);
    expect(
      isTextOnlyEdit({
        action: 'edited',
        changes: { ...changes, base: { ref: { from: 'feature' } } },
      }),
    ).toBe(false);
    expect(isTextOnlyEdit({ action: 'edited', changes: {} })).toBe(false);
    expect(isTextOnlyEdit({ action: 'edited', changes: { body: {} } })).toBe(false);
    expect(isTextOnlyEdit({ action: 'synchronize', changes })).toBe(false);
  });

  it('reuses the matching successful attempt across successive text edits', async () => {
    const metadata = { ...run(2), display_title: metadataTitle };
    const get = vi
      .fn<(path: string) => Promise<unknown>>()
      .mockResolvedValueOnce({ workflow_runs: [run(3, null), metadata, run(1)] })
      .mockResolvedValueOnce(jobs(reused))
      .mockResolvedValueOnce(metadata)
      .mockResolvedValueOnce(jobs(verified))
      .mockResolvedValueOnce(run(1));

    await expect(hasCheckEvidence(request, get)).resolves.toBe(true);
    expect(get.mock.calls.map(([path]) => path)).toEqual([
      `workflows/ci.yml/runs?event=pull_request&head_sha=${revisions.head}&per_page=5`,
      'runs/2/attempts/2/jobs?per_page=100',
      'runs/2',
      'runs/1/attempts/2/jobs?per_page=100',
      'runs/1',
    ]);
  });

  it('waits for a later code run of the same PR and checks its completed attempt', async () => {
    const active = { ...run(4, null), display_title: codeTitle, status: 'in_progress' };
    const completed = { ...active, status: 'completed', conclusion: 'success' };
    const get = vi
      .fn<(path: string) => Promise<unknown>>()
      .mockResolvedValueOnce({ workflow_runs: [run(3, null)] })
      .mockResolvedValueOnce({ workflow_runs: [active, run(3, null)] })
      .mockResolvedValueOnce({ workflow_runs: [completed, run(3, null)] })
      .mockResolvedValueOnce(jobs(verified))
      .mockResolvedValueOnce(completed);
    const wait = vi.fn().mockResolvedValue(undefined);

    await expect(hasCheckEvidence(request, get, wait)).resolves.toBe(true);
    expect(wait.mock.calls).toEqual([[2000], [15_000]]);
    expect(get).toHaveBeenNthCalledWith(4, 'runs/4/attempts/2/jobs?per_page=100');
  });

  it('falls back when the API cannot associate the candidate with the same project and PR', async () => {
    const exact = { ...run(4), display_title: codeTitle };
    const association = exact.pull_requests[0];
    const get = vi.fn<(path: string) => Promise<unknown>>().mockResolvedValue({
      workflow_runs: [
        { ...exact, pull_requests: [{ ...association, number: pullRequest + 1 }] },
        { ...exact, pull_requests: [] },
        { ...exact, repository: { full_name: 'other/ml-teaching' } },
      ],
    });
    const wait = vi.fn().mockResolvedValue(undefined);

    await expect(hasCheckEvidence(request, get, wait)).resolves.toBe(false);
    expect(wait).not.toHaveBeenCalled();
    expect(get).toHaveBeenCalledTimes(1);
  });

  it.each([
    { ...run(5, 'failure'), display_title: metadataTitle },
    { ...run(5), pull_requests: [] },
  ])('rejects older proof in the presence of newer negative or unknown evidence', async (newer) => {
    const get = vi.fn().mockResolvedValue({ workflow_runs: [newer, run(1)] });
    await expect(hasCheckEvidence(request, get)).resolves.toBe(false);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('rejects a truncated candidate list before accepting proof', async () => {
    const get = vi.fn().mockResolvedValue({ workflow_runs: [run(1)], total_count: 6 });
    await expect(hasCheckEvidence(request, get)).resolves.toBe(false);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('falls back on an API response served from cache even at age zero', async () => {
    using directory = mkdtempDisposableSync(join(tmpdir(), 'ml-teaching-pr-evidence-'));
    const eventPath = join(directory.path, 'event.json');
    writeFileSync(
      eventPath,
      JSON.stringify({
        action: 'edited',
        number: pullRequest,
        changes: { title: { from: 'Old' } },
      }),
    );
    vi.stubEnv('GITHUB_EVENT_PATH', eventPath);
    vi.stubEnv('GITHUB_EVENT_NAME', 'pull_request');
    vi.stubEnv('GITHUB_RUN_ATTEMPT', '1');
    vi.stubEnv('GITHUB_REPOSITORY', repository);
    vi.stubEnv('GITHUB_RUN_ID', String(request.runId));
    vi.stubEnv('GITHUB_RUN_NUMBER', String(request.runNumber));
    const json = vi.fn();
    const fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({ Age: '0', Date: new Date().toUTCString() }),
      json,
    });
    vi.stubGlobal('fetch', fetch);
    try {
      await expect(reusableCheck('ci', revisions)).resolves.toBe(false);
      expect(fetch).toHaveBeenCalledOnce();
      expect(json).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
    }
  });

  it('stops waiting when a code run fails or exceeds the scanner lookup budget', async () => {
    const active = {
      ...run(4, null),
      path: '.github/workflows/gitleaks.yml',
      display_title: codeTitle,
      status: 'in_progress',
    };
    const scanner = { ...request, workflow: 'gitleaks' } as const;
    const get = vi
      .fn<(path: string) => Promise<unknown>>()
      .mockResolvedValueOnce({ workflow_runs: [active] })
      .mockResolvedValueOnce({
        workflow_runs: [{ ...active, status: 'completed', conclusion: 'failure' }],
      })
      .mockResolvedValue({ workflow_runs: [active] });
    const wait = vi.fn().mockResolvedValue(undefined);

    await expect(hasCheckEvidence(scanner, get, wait)).resolves.toBe(false);
    expect(get).toHaveBeenCalledTimes(2);
    get.mockClear();
    wait.mockClear();
    await expect(hasCheckEvidence(scanner, get, wait)).resolves.toBe(false);
    expect(get).toHaveBeenCalledTimes(5);
    expect(wait).toHaveBeenCalledTimes(4);
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
      .mockResolvedValueOnce(completed);

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

  it('requires recent original proof, even when a recent edit reused it', async () => {
    const metadata = { ...run(2), display_title: metadataTitle };
    const get = vi
      .fn<(path: string) => Promise<unknown>>()
      .mockResolvedValueOnce({ workflow_runs: [metadata, run(1)] })
      .mockResolvedValueOnce(jobs(reused))
      .mockResolvedValueOnce(metadata)
      .mockResolvedValueOnce(jobs(verified, '2020-01-01T00:00:00Z'));

    await expect(hasCheckEvidence(request, get)).resolves.toBe(false);
  });

  it('rejects a reuse plan carried into a partial rerun despite successful job results', () => {
    const plan = {
      version: ciPlanVersion,
      ...revisions,
      reason: 'verified-revision',
      quality: false,
      browser: false,
    };
    const results = { plan: 'success', quality: 'skipped', browser: 'skipped' };
    const edit = { action: 'edited', changes: { title: { from: 'Original title' } } };
    const allowReuse = (attempt: string) =>
      canReuseCheckEvidence(edit, {
        GITHUB_EVENT_NAME: 'pull_request',
        GITHUB_RUN_ATTEMPT: attempt,
      });

    expect(() => validateResults(plan, revisions, results, allowReuse('1'))).not.toThrow();
    expect(() => validateResults(plan, revisions, results, allowReuse('2'))).toThrow(
      /first attempt/,
    );
    expect(() => validateResults(plan, revisions, results)).toThrow();
    expect(() => validateResults(plan, revisions, { ...results, plan: 'failure' }, true)).toThrow();
  });
});
