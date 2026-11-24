import { describe, expect, it, vi } from 'vitest';
import { ciPlanVersion } from '../../../.github/scripts/plan-ci.ts';
import { hasCheckEvidence, isTextOnlyEdit } from '../../../.github/scripts/pr-check-evidence.ts';
import { validateResults } from '../../../.github/scripts/validate-ci.ts';

const revisions = { base: 'a'.repeat(40), head: 'b'.repeat(40), merge: 'c'.repeat(40) };
const identity = `${revisions.base} ${revisions.head} ${revisions.merge}`;
const request = { workflow: 'ci', revisions, runNumber: 3 } as const;
const verified = `Verified PR revisions ${identity}`;
const reused = `Reused PR revisions ${identity}`;

function run(number: number, conclusion: string | null = 'success') {
  return {
    id: number,
    run_number: number,
    run_attempt: 2,
    conclusion,
    head_sha: revisions.head,
    event: 'pull_request',
    path: '.github/workflows/ci.yml@main',
  };
}

function jobs(name: string, completedAt = new Date().toISOString()) {
  return {
    jobs: [
      {
        name: 'CI',
        conclusion: 'success',
        steps: [{ name, conclusion: 'success', completed_at: completedAt }],
      },
    ],
  };
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
    const get = vi
      .fn<(path: string) => Promise<unknown>>()
      .mockResolvedValueOnce({ workflow_runs: [run(3, null), run(2), run(1)] })
      .mockResolvedValueOnce(jobs(reused))
      .mockResolvedValueOnce(jobs(verified));

    await expect(hasCheckEvidence(request, get)).resolves.toBe(true);
    expect(get.mock.calls.map(([path]) => path)).toEqual([
      `workflows/ci.yml/runs?event=pull_request&head_sha=${revisions.head}&per_page=5`,
      'runs/2/attempts/2/jobs',
      'runs/1/attempts/2/jobs',
    ]);
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
    const get = vi
      .fn<(path: string) => Promise<unknown>>()
      .mockResolvedValueOnce({ workflow_runs: [run(2), run(1)] })
      .mockResolvedValueOnce(jobs(reused))
      .mockResolvedValueOnce(jobs(verified, '2020-01-01T00:00:00Z'));

    await expect(hasCheckEvidence(request, get)).resolves.toBe(false);
  });

  it('allows recorded reuse only on text edits with the expected job results', () => {
    const plan = {
      version: ciPlanVersion,
      ...revisions,
      reason: 'verified-revision',
      quality: false,
      browser: false,
    };
    const results = { plan: 'success', quality: 'skipped', browser: 'skipped' };

    expect(() => validateResults(plan, revisions, results, true)).not.toThrow();
    expect(() => validateResults(plan, revisions, results)).toThrow();
    expect(() => validateResults(plan, revisions, { ...results, plan: 'failure' }, true)).toThrow();
  });
});
