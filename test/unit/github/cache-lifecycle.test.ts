import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import cachePolicy from '../../../.github/cache-policy.json';
import { runLifecycle } from '../../../.github/scripts/cache-lifecycle/core.cjs';
import { createGhApi } from '../../../.github/scripts/cache-lifecycle/github.cjs';
import {
  cache,
  FixtureApi,
  generations,
  options,
  previousHead,
  receipt,
  run,
} from './cache-fixtures';

const codeqlWorkflow = { name: 'Push on main', path: 'dynamic/github-code-scanning/codeql' };
const codeqlKey = (sha: string, runId = 20) =>
  `codeql-overlay-base-database-1-js-${sha}-${runId}-1`;
const lifecycleWorkflow = {
  name: 'Cache lifecycle',
  path: '.github/workflows/cache-lifecycle.yml',
  workflow_id: 123,
  event: 'workflow_run',
};

function lifecycleOptions(api: FixtureApi, event = 'workflow_run') {
  const current = {
    ...run({ id: 40, status: 'in_progress', conclusion: null }),
    ...lifecycleWorkflow,
    event,
  };
  const read = api.read.bind(api);
  vi.spyOn(api, 'read').mockImplementation((path) =>
    path.endsWith('/actions/runs/40') ? current : read(path),
  );
  return { ...options(api, event), runId: current.id, workflow: current.name };
}

describe('cache lifecycle', () => {
  it('removes only API-confirmed closed PR caches without an associated active run', () => {
    const api = new FixtureApi();
    api.caches = [
      cache(1, 'pr-closed', 'refs/pull/1/merge'),
      cache(2, 'pr-open', 'refs/pull/2/head'),
      cache(3, 'pr-busy', 'refs/pull/3/merge'),
      cache(4, 'unknown-main'),
    ];
    for (const number of [1, 2, 3]) {
      api.prs[number] = {
        state: number === 2 ? 'open' : 'closed',
        head: { sha: String(number).repeat(40), ref: `branch-${number}` },
      };
    }
    api.runs = [run({ id: 30, status: 'in_progress', head_branch: 'branch-3' })];
    const opts = options(api, 'pull_request_target');
    opts.event = { action: 'closed', pull_request: { number: 1 } };
    expect(runLifecycle(opts).deleted.map(({ id }) => id)).toEqual([1]);
    expect(api.caches.map(({ id }) => id)).toEqual([2, 3, 4]);
  });

  it('rotates only older compatible generations after successful trusted producer proof', () => {
    const api = new FixtureApi();
    generations(api);
    api.caches.push(cache(3, 'other-family-old'), cache(4, 'retired-npm-old'));
    expect(runLifecycle(options(api)).deleted.map(({ id }) => id)).toEqual([1]);
    expect(api.caches.map(({ id }) => id)).toEqual([2, 3, 4]);
  });

  it('rejects a producer without the allowlisted successful job', () => {
    const api = new FixtureApi();
    generations(api);
    api.jobs = [{ name: 'warm', status: 'completed', conclusion: 'failure' }];
    expect(() => runLifecycle(options(api))).toThrow(/producer job/i);
    expect(api.removed).toEqual([]);
  });

  it.each(['empty', 'ambiguous'] as const)(
    'protects generations when replacement is %s',
    (problem) => {
      const api = new FixtureApi();
      generations(api);
      if (problem === 'empty') api.caches[1].size_in_bytes = 0;
      else api.caches.push(cache(3, receipt.key, 'refs/heads/main', true));
      expect(runLifecycle(options(api)).deleted).toEqual([]);
    },
  );

  it('defers main rotation while another workflow is active', () => {
    const api = new FixtureApi();
    generations(api);
    api.runs = [run({ id: 30, status: 'queued', name: 'CI' })];
    const result = runLifecycle(options(api));
    expect(result.deleted).toEqual([]);
    expect(result.deferred).toBe(1);
  });

  it('resumes main rotation when only a waiting sibling of the same workflow remains', () => {
    const api = new FixtureApi();
    generations(api);
    const sibling = {
      ...run({ id: 30, status: 'pending', conclusion: null }),
      ...lifecycleWorkflow,
    };
    api.runs = [sibling, run({ id: 31, name: 'CI', status: 'in_progress', conclusion: null })];
    const opts = lifecycleOptions(api);
    expect(runLifecycle(opts)).toMatchObject({ deleted: [], deferred: 1 });

    api.runs = [sibling];
    expect(runLifecycle(opts).deleted.map(({ id }) => id)).toEqual([1]);
    expect(api.caches.map(({ id }) => id)).toEqual([2]);
  });

  it.each([{ status: 'in_progress' }, { workflow_id: undefined }, { workflow_id: 456 }])(
    'preserves main caches when a sibling is running or its identity is unclear: %j',
    (override) => {
      const api = new FixtureApi();
      generations(api);
      api.runs = [
        {
          ...run({ id: 30, status: 'queued', conclusion: null }),
          ...lifecycleWorkflow,
          ...override,
        },
      ];
      expect(runLifecycle(lifecycleOptions(api))).toMatchObject({ deleted: [], deferred: 1 });
      expect(api.removed).toEqual([]);
    },
  );

  it('recovers pending main rotation on a pull request close', () => {
    const api = new FixtureApi();
    generations(api);
    const opts = lifecycleOptions(api, 'pull_request_target');
    opts.event = { action: 'closed', pull_request: { number: 1 } };
    expect(runLifecycle(opts).deleted.map(({ id }) => id)).toEqual([1]);
  });

  it('serializes lifecycle runs across both event types', () => {
    const workflow = readFileSync(lifecycleWorkflow.path, 'utf8');
    expect(workflow).toMatch(
      /^concurrency:\n  group: cache-lifecycle\n  cancel-in-progress: false$/m,
    );
  });

  it('ignores CodeQL proof candidates from non-main refs or empty caches', () => {
    const api = new FixtureApi();
    const opts = options(api, 'workflow_run');
    opts.policy.codeqlWorkflows = [codeqlWorkflow];
    api.caches = [
      cache(1, codeqlKey(previousHead)),
      cache(2, codeqlKey(opts.sha, 21), 'refs/heads/topic', true),
      { ...cache(3, codeqlKey(opts.sha, 22), 'refs/heads/main', true), size_in_bytes: 0 },
    ];
    expect(runLifecycle(opts).deleted).toEqual([]);
    expect(api.caches.map(({ id }) => id)).toEqual([1, 2, 3]);
  });

  it('retires older CodeQL snapshots separately for each cache version', () => {
    const api = new FixtureApi();
    const opts = options(api, 'workflow_run');
    opts.policy.codeqlWorkflows = cachePolicy.codeqlWorkflows;
    api.triggering = run({
      id: 20,
      ...codeqlWorkflow,
      event: 'dynamic',
    });
    api.caches = [
      cache(1, codeqlKey(previousHead)),
      { ...cache(2, codeqlKey(previousHead)), version: 'v2' },
      cache(3, codeqlKey(opts.sha), 'refs/heads/main', true),
      { ...cache(4, codeqlKey(opts.sha), 'refs/heads/main', true), version: 'v2' },
      { ...cache(5, codeqlKey(previousHead)), version: 'v3' },
    ];
    api.runs = [run({ id: 30, status: 'queued', name: 'CI' })];
    expect(runLifecycle(opts)).toMatchObject({ deleted: [], deferred: 2 });
    api.runs = [];
    expect(runLifecycle(opts).deleted.map(({ id }) => id)).toEqual([1, 2]);
    expect(api.caches.map(({ id }) => id)).toEqual([3, 4, 5]);
  });

  it.each([
    { path: '.github/workflows/codeql.yml' },
    { run_attempt: 2 },
    { conclusion: 'failure' },
  ])('preserves predecessors when managed CodeQL provenance differs: %j', (override) => {
    const api = new FixtureApi();
    const opts = options(api, 'workflow_run');
    opts.policy.codeqlWorkflows = cachePolicy.codeqlWorkflows;
    api.triggering = run({ id: 20, ...codeqlWorkflow, event: 'dynamic', ...override });
    api.caches = [
      cache(1, codeqlKey(previousHead)),
      cache(2, codeqlKey(opts.sha), 'refs/heads/main', true),
    ];
    expect(runLifecycle(opts).deleted).toEqual([]);
    expect(api.caches.map(({ id }) => id)).toEqual([1, 2]);
  });

  it('fails without deleting anything if main moves during planning', () => {
    const api = new FixtureApi();
    generations(api);
    api.moveHead = true;
    expect(() => runLifecycle(options(api))).toThrow(/branch changed/i);
    expect(api.removed).toEqual([]);
  });

  it('preserves main caches when the branch advances during the PR recheck', () => {
    const api = new FixtureApi();
    generations(api);
    api.caches.push(cache(3, 'pr-closed', 'refs/pull/3/merge'));
    api.prs[3] = { state: 'closed', head: { sha: previousHead, ref: 'branch-3' } };
    const read = api.read.bind(api);
    let prReads = 0;
    vi.spyOn(api, 'read').mockImplementation((path) => {
      if (path.endsWith('/pulls/3') && ++prReads === 2) api.moveHead = true;
      return read(path);
    });

    expect(runLifecycle(options(api))).toMatchObject({ deferred: 1, remainingCount: 2 });
    expect(api.removed).toEqual([3]);
  });

  it('preserves main caches when a consumer starts during PR cache removal', () => {
    const api = new FixtureApi();
    generations(api);
    api.caches.push(cache(3, 'pr-closed', 'refs/pull/3/merge'));
    api.prs[3] = { state: 'closed', head: { sha: previousHead, ref: 'branch-3' } };
    const remove = api.remove.bind(api);
    vi.spyOn(api, 'remove').mockImplementation((id) => {
      remove(id);
      api.runs = [run({ id: 30, status: 'in_progress', name: 'CI' })];
    });

    expect(runLifecycle(options(api))).toMatchObject({ deferred: 1, activeRuns: 1 });
    expect(api.removed).toEqual([3]);
  });

  it.each(['main advances', 'replacement disappears'])(
    'stops after the first main group when %s',
    (change) => {
      const api = new FixtureApi();
      const old = Array.from({ length: 21 }, (_, index) =>
        cache(index + 10, `npm-cache-linux-old-${index}`),
      );
      api.caches = [...old, cache(2, receipt.key, 'refs/heads/main', true)];
      const remove = api.remove.bind(api);
      vi.spyOn(api, 'remove').mockImplementation((id) => {
        remove(id);
        if (id !== old[19].id) return;
        if (change === 'main advances') api.moveHead = true;
        else api.caches = api.caches.filter((entry) => entry.id !== 2);
      });

      expect(runLifecycle(options(api))).toMatchObject({ deferred: 1 });
      expect(api.removed).toEqual(old.slice(0, 20).map(({ id }) => id));
      expect(api.caches).toContain(old[20]);
    },
  );

  it('preserves CodeQL caches if the replacement run attempt changes during PR cleanup', () => {
    const api = new FixtureApi();
    const opts = options(api, 'workflow_run');
    opts.policy.codeqlWorkflows = [codeqlWorkflow];
    api.triggering = run({ id: 20, ...codeqlWorkflow, event: 'dynamic' });
    api.caches = [
      cache(1, codeqlKey(previousHead)),
      cache(2, codeqlKey(opts.sha), 'refs/heads/main', true),
      cache(3, 'pr-closed', 'refs/pull/3/merge'),
    ];
    api.prs[3] = { state: 'closed', head: { sha: previousHead, ref: 'branch-3' } };
    const remove = api.remove.bind(api);
    vi.spyOn(api, 'remove').mockImplementation((id) => {
      remove(id);
      api.triggering.run_attempt += 1;
    });

    expect(runLifecycle(opts)).toMatchObject({ deferred: 1, remainingCount: 2 });
    expect(api.removed).toEqual([3]);
  });

  it('drains a verified backlog in successive batches and keeps the replacement', () => {
    const api = new FixtureApi();
    const old = Array.from({ length: 101 }, (_, i) => cache(i + 10, `npm-cache-linux-old-${i}`));
    const replacement = cache(2, receipt.key, 'refs/heads/main', true);
    const unknown = cache(3, 'unknown-main');
    api.caches = [...old, replacement, unknown];
    const opts = options(api);

    expect(runLifecycle(opts)).toMatchObject({ deferred: 1, remainingCount: 3 });
    expect(api.removed).toEqual(old.slice(0, 100).map(({ id }) => id));
    expect(runLifecycle({ ...opts, runNumber: 2 })).toMatchObject({
      deferred: 0,
      remainingCount: 2,
    });
    expect(api.removed).toEqual(old.map(({ id }) => id));
    expect(api.caches).toEqual([replacement, unknown]);
  });

  it('fills the batch with verified candidates when an earlier cache was accessed again', () => {
    const api = new FixtureApi();
    const old = Array.from({ length: 101 }, (_, i) => cache(i + 10, `npm-cache-linux-old-${i}`));
    const replacement = cache(2, receipt.key, 'refs/heads/main', true);
    api.caches = [...old, replacement];
    const list = api.list.bind(api);
    let inventories = 0;
    vi.spyOn(api, 'list').mockImplementation((path) => {
      if (path.includes('/actions/caches?') && ++inventories === 2)
        old[0].last_accessed_at = '2026-02-02T00:00:00Z';
      return list(path);
    });

    expect(runLifecycle(options(api))).toMatchObject({ deferred: 1, remainingCount: 2 });
    expect(api.removed).toEqual(old.slice(1).map(({ id }) => id));
    expect(api.caches).toEqual([old[0], replacement]);
  });

  it('reaches later PR identities when the first window contains open or busy PRs', () => {
    const api = new FixtureApi();
    api.caches = Array.from({ length: 101 }, (_, index) => {
      const number = index + 1;
      api.prs[number] = {
        state: number < 100 ? 'open' : 'closed',
        head: { sha: previousHead, ref: `branch-${number}` },
      };
      return cache(number, `pr-${number}`, `refs/pull/${number}/merge`);
    });
    api.runs = [run({ id: 30, status: 'in_progress', head_branch: 'branch-100' })];
    const read = vi.spyOn(api, 'read');
    const opts = options(api, 'workflow_run');

    expect(runLifecycle(opts)).toMatchObject({ deleted: [], unverifiedPullRequests: 1 });
    expect(read.mock.calls.filter(([path]) => path.includes('/pulls/'))).toHaveLength(100);
    expect(runLifecycle({ ...opts, runNumber: 2 })).toMatchObject({ unverifiedPullRequests: 100 });
    expect(api.removed).toEqual([101]);
    expect(api.caches.map(({ id }) => id)).toContain(100);
  });

  it('rechecks the triggering closed PR even when it falls outside the current window', () => {
    const api = new FixtureApi();
    api.caches = Array.from({ length: 101 }, (_, index) => {
      const number = index + 1;
      api.prs[number] = {
        state: number === 101 ? 'closed' : 'open',
        head: { sha: previousHead, ref: `branch-${number}` },
      };
      return cache(number, `pr-${number}`, `refs/pull/${number}/merge`);
    });
    const opts = options(api, 'pull_request_target');
    opts.event = { action: 'closed', pull_request: { number: 101 } };

    expect(runLifecycle(opts)).toMatchObject({ deferred: 0, unverifiedPullRequests: 1 });
    expect(api.removed).toEqual([101]);
  });

  it('defers PR caches if the PR reopened or acquired an active run before deletion', () => {
    const api = new FixtureApi();
    const opts = options(api, 'workflow_run');
    const pr = { state: 'closed', head: { sha: previousHead, ref: 'branch-1' } };
    api.prs = { 1: pr, 2: { ...pr, head: { ...pr.head, ref: 'branch-2' } } };
    api.caches = [
      cache(1, 'pr-reopened', 'refs/pull/1/merge'),
      cache(2, 'pr-now-busy', 'refs/pull/2/head'),
    ];
    const list = api.list.bind(api);
    let inventories = 0;
    vi.spyOn(api, 'list').mockImplementation((path) => {
      if (path.includes('/actions/caches?') && ++inventories === 2) {
        pr.state = 'open';
        api.runs.push(run({ id: 30, status: 'in_progress', head_branch: 'branch-2' }));
      }
      return list(path);
    });
    expect(runLifecycle(opts)).toMatchObject({ deleted: [], deferred: 2 });
    expect(api.removed).toEqual([]);
  });

  it('continues other cleanup when the CodeQL proof window is full', () => {
    const api = new FixtureApi();
    generations(api);
    const opts = options(api, 'workflow_run');
    opts.policy.codeqlWorkflows = [codeqlWorkflow];
    api.codeqlRuns = Array.from({ length: 26 }, (_, index) =>
      run({
        id: index + 30,
        ...codeqlWorkflow,
        event: 'dynamic',
        conclusion: index === 0 ? 'success' : 'failure',
      }),
    );
    const snapshots = api.codeqlRuns.map(({ id }) =>
      cache(id, codeqlKey(opts.sha, id), 'refs/heads/main', true),
    );
    api.caches.push(cache(3, codeqlKey(previousHead)), ...snapshots);
    const read = vi.spyOn(api, 'read');

    expect(runLifecycle(opts)).toMatchObject({ unverifiedCodeqlRuns: 1 });
    expect(read.mock.calls.filter(([path]) => /\/actions\/runs\/[3-5]\d$/.test(path))).toHaveLength(
      25,
    );
    expect(api.removed).toEqual([1]);
    expect(runLifecycle({ ...opts, runNumber: 2 })).toMatchObject({ unverifiedCodeqlRuns: 25 });
    expect(api.removed).toEqual([1, 3]);
    expect(api.caches.slice(1)).toEqual(snapshots);
  });

  it('recovers a trusted producer receipt despite a full page of newer unrelated main runs', () => {
    const api = new FixtureApi();
    generations(api);
    api.producer = run({ head_sha: previousHead });
    api.otherCompletedRuns = Array.from({ length: 20 }, (_, index) =>
      run({ id: 100 + index, name: 'Cache lifecycle', path: '.github/workflows/cleanup.yml' }),
    );
    expect(runLifecycle(options(api, 'workflow_run')).deleted.map(({ id }) => id)).toEqual([1]);
  });

  it('does not recover a receipt if producer inputs changed or the producer is untrusted', () => {
    const changed = new FixtureApi();
    generations(changed);
    changed.producer = run({ head_sha: previousHead });
    changed.files = ['package-lock.json'];
    expect(runLifecycle(options(changed, 'workflow_run')).deleted).toEqual([]);
    const untrusted = new FixtureApi();
    generations(untrusted);
    untrusted.producer = run({ head_sha: previousHead, path: '.github/workflows/untrusted.yml' });
    expect(runLifecycle(options(untrusted, 'workflow_run')).deleted).toEqual([]);
  });

  it('keeps npm generations and retires independently verified caches after receipt expiry', () => {
    const api = new FixtureApi();
    generations(api);
    const opts = options(api, 'workflow_run');
    opts.policy.codeqlWorkflows = cachePolicy.codeqlWorkflows;
    api.triggering = run({ id: 20, ...codeqlWorkflow, event: 'dynamic' });
    api.caches.push(
      cache(3, 'pr-closed', 'refs/pull/1/merge'),
      cache(4, codeqlKey(previousHead)),
      cache(5, codeqlKey(opts.sha), 'refs/heads/main', true),
    );
    api.prs[1] = { state: 'closed', head: { sha: previousHead, ref: 'merged-branch' } };
    const expired = {
      id: 2,
      name: 'cache-lifecycle-receipts-1',
      expired: true,
      size_in_bytes: 277,
    };
    const pages = [{ id: 1 }, expired].map((item) => ({ total_count: 2, artifacts: [item] }));
    const nativeApi = createGhApi(opts.repository, () => JSON.stringify(pages));
    vi.spyOn(api, 'readReceipts').mockImplementation(nativeApi.readReceipts);

    expect(runLifecycle(opts).deleted.map(({ id }) => id)).toEqual([3, 4]);
    expect(api.caches.map(({ id }) => id)).toEqual([1, 2, 5]);
  });

  it('defers npm rotation on a receipt verification error and still handles a closed PR', () => {
    const api = new FixtureApi();
    generations(api);
    api.caches.push(cache(3, 'pr-closed', 'refs/pull/1/merge'));
    api.prs[1] = { state: 'closed', head: { sha: previousHead, ref: 'merged-branch' } };
    vi.spyOn(api, 'readReceipts').mockImplementation(() => {
      throw new Error('Invalid receipt metadata');
    });

    expect(runLifecycle(options(api, 'workflow_run')).deleted.map(({ id }) => id)).toEqual([3]);
    expect(api.caches.map(({ id }) => id)).toEqual([1, 2]);
  });

  it('reports failed deletion readback', () => {
    const api = new FixtureApi();
    generations(api);
    api.keepDeleted = true;
    expect(() => runLifecycle(options(api))).toThrow(/readback failed/i);
    expect(api.removed).toEqual([1]);
  });

  it('rejects producer context from a different main revision', () => {
    const api = new FixtureApi();
    generations(api);
    const opts = options(api);
    opts.sha = previousHead;
    expect(() => runLifecycle(opts)).toThrow(/untrusted producer/i);
    expect(api.removed).toEqual([]);
  });
});
