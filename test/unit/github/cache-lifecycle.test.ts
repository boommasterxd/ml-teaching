import { describe, expect, it } from 'vitest';
import cachePolicy from '../../../.github/cache-policy.json';
import { runLifecycle } from '../../../.github/scripts/cache-lifecycle/core.cjs';
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

  it('fails closed when the deletion budget is exceeded', () => {
    const api = new FixtureApi();
    generations(api);
    api.caches = Array.from({ length: 101 }, (_, i) => cache(i + 10, `npm-cache-linux-old-${i}`));
    api.caches.push(cache(2, receipt.key, 'refs/heads/main', true));
    expect(() => runLifecycle(options(api))).toThrow(/budget exceeded/i);
    expect(api.removed).toEqual([]);
  });

  it('recovers a trusted producer receipt after unrelated main changes', () => {
    const api = new FixtureApi();
    generations(api);
    api.producer = run({ head_sha: previousHead });
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

  it('preserves caches when a recovered receipt is expired', () => {
    const api = new FixtureApi();
    generations(api);
    api.producer = run({ head_sha: previousHead });
    api.receipts = [];
    expect(runLifecycle(options(api, 'workflow_run')).deleted).toEqual([]);
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
