import { expect, it, vi } from 'vitest';
import cachePolicy from '../../../.github/cache-policy.json';
import { runLifecycle } from '../../../.github/scripts/cache-lifecycle/core.cjs';
import { createGhApi } from '../../../.github/scripts/cache-lifecycle/github.cjs';
import { cache, FixtureApi, generations, options, previousHead, run } from './cache-fixtures';

const codeqlWorkflow = { name: 'Push on main', path: 'dynamic/github-code-scanning/codeql' };
const codeqlKey = (sha: string) => `codeql-overlay-base-database-1-js-${sha}-20-1`;

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
  const incomplete = JSON.stringify([{ total_count: 4, actions_caches: api.caches.slice(0, 1) }]);
  const readInventory = vi.fn(() => incomplete);
  const wait = vi.fn<(milliseconds: number) => void>();
  const provider = createGhApi(opts.repository, readInventory, wait);
  const list = api.list.bind(api);
  vi.spyOn(opts.api, 'list').mockImplementation((endpoint, field) =>
    field === 'actions_caches' ? provider.list(endpoint, field) : list(endpoint),
  );

  expect(() => runLifecycle(opts)).toThrow(
    'GitHub list inventory failed (incomplete row count: caches)',
  );
  expect(readInventory).toHaveBeenCalledTimes(3);
  expect(wait.mock.calls).toEqual([[250], [1000]]);
  expect(api.removed).toEqual([]);

  wait.mockClear();
  readInventory
    .mockReturnValueOnce(incomplete)
    .mockReturnValueOnce(incomplete)
    .mockImplementation(() =>
      JSON.stringify([{ total_count: api.caches.length, actions_caches: api.caches }]),
    );
  expect(runLifecycle(opts).deleted.map(({ id }) => id)).toEqual([1]);
  expect(wait.mock.calls).toEqual([[250], [1000]]);
  expect(api.caches.map(({ id }) => id)).toEqual([2, 3, 4]);
});

it('rotates only older compatible generations after successful trusted producer proof', () => {
  const api = new FixtureApi();
  generations(api);
  api.caches.push(cache(3, 'other-family-old'), cache(4, 'retired-npm-old'));
  const replacement = api.caches[1];
  const size = replacement.size_in_bytes;
  replacement.size_in_bytes = 0;
  expect(runLifecycle(options(api)).deleted).toEqual([]);
  replacement.size_in_bytes = size;
  expect(runLifecycle(options(api)).deleted.map(({ id }) => id)).toEqual([1]);
  expect(api.caches.map(({ id }) => id)).toEqual([2, 3, 4]);
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
