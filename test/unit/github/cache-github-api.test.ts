import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { runLifecycle } from '../../../.github/scripts/cache-lifecycle/core.cjs';
import { createGhApi } from '../../../.github/scripts/cache-lifecycle/github.cjs';
import { FixtureApi, cache, generations, options, receipt, run, warmJob } from './cache-fixtures';

describe('GitHub cache adapter', () => {
  const endpoint = 'repos/owner/repo/actions/runs?status=queued&per_page=100';
  const page = (total_count: number, id: unknown) => ({ total_count, workflow_runs: [{ id }] });
  const capped = Array.from({ length: 10 }, (_, index) => ({
    total_count: 1000,
    workflow_runs: Array.from({ length: 100 }, (_, row) => ({ id: index * 100 + row + 1 })),
  }));

  it.each([
    ['missing total', [{ workflow_runs: [] }]],
    ['negative total', [page(-1, 1)]],
    ['malformed page', [page(2, 1), { total_count: 2, workflow_runs: null }]],
    ['duplicate IDs', [page(2, 1), page(3, 1)]],
    ['non-numeric ID', [page(1, '1')]],
    ['capped search', capped],
  ])('rejects an unverifiable workflow inventory with %s', (_reason, pages) => {
    const call = vi.fn(() => JSON.stringify(pages));
    const api = createGhApi('owner/repo', call);
    expect(() => api.list(endpoint, 'workflow_runs')).toThrow();
    expect(call).toHaveBeenCalledOnce();
  });

  it('restarts the whole inventory after count drift and uses only the fresh pages', () => {
    const call = vi
      .fn<(args: string[]) => string>()
      .mockReturnValueOnce(JSON.stringify([page(2, 1), page(3, 2)]))
      .mockReturnValueOnce(JSON.stringify([page(1, 3)]));
    const api = createGhApi('owner/repo', call);
    expect(api.list(endpoint, 'workflow_runs')).toEqual([{ id: 3 }]);
    expect(call.mock.calls).toHaveLength(2);
    expect(call.mock.calls[1]).toEqual(call.mock.calls[0]);
    expect(call.mock.calls[1][0]).toEqual(expect.arrayContaining(['GET', '--paginate', '--slurp']));
  });

  it('fails closed after a single restart when the inventory remains incomplete', () => {
    const call = vi.fn(() => JSON.stringify([page(2, 1)]));
    const api = createGhApi('owner/repo', call);
    expect(() => api.list(endpoint, 'workflow_runs')).toThrow(/incomplete row count/);
    expect(call).toHaveBeenCalledTimes(2);
  });

  it('reports fixed failures for CLI errors and invalid response content', () => {
    const call = vi.fn((args: string[]) => {
      if (args.includes('DELETE')) throw Object.assign(new Error('stderr'), { code: 'ETIMEDOUT' });
      return 'private response body';
    });
    const api = createGhApi('owner/repo', call);
    expect(() => api.remove(2)).toThrow(/^GitHub delete cache failed \(timeout\)$/);
    expect(() => api.read(endpoint)).toThrow(/^GitHub read metadata failed \(invalid JSON\)$/);
    expect(call.mock.calls.filter(([args]) => args.includes('DELETE'))).toHaveLength(1);
  });
});

describe('producer receipt recovery', () => {
  function failedCleanupProducer() {
    const api = new FixtureApi();
    generations(api);
    api.producer = run({ conclusion: 'failure' });
    api.jobs = [
      warmJob(api.producer),
      { ...warmJob(api.producer, 'failure'), name: 'Retire replaced caches' },
    ];
    return api;
  }

  it('recovers the exact warmup receipt when only the cleanup job failed', () => {
    const api = failedCleanupProducer();
    const reads = vi.spyOn(api, 'readReceipts');
    const opts = options(api, 'workflow_run');
    expect(runLifecycle(opts).deleted.map(({ id }) => id)).toEqual([1]);
    expect(reads).toHaveBeenCalledWith({
      runId: api.producer.id,
      attempt: api.producer.run_attempt,
      head: opts.sha,
      branch: 'main',
      repositoryId: api.producer.repository?.id,
    });
    expect(api.caches.map(({ id }) => id)).toEqual([2]);
  });

  it.each([
    ['failed warmup', { conclusion: 'failure' }, {}],
    ['cancelled warmup', { conclusion: 'cancelled' }, {}],
    ['different attempt', { run_attempt: 2 }, {}],
    ['unrelated tail job', {}, { name: 'Unrelated failure' }],
  ])(
    'discards a newer producer with %s but still cleans independently verified PR caches',
    (_reason, warm, tail) => {
      const api = failedCleanupProducer();
      api.previousProducers = [run({ id: 9 })];
      api.jobs = api.jobs?.map((job, index) => ({ ...(job as object), ...(index ? tail : warm) }));
      api.caches.push(cache(3, 'closed', 'refs/pull/1/merge'));
      api.prs[1] = { state: 'closed', head: { sha: api.producer.head_sha, ref: 'merged-branch' } };
      const reads = vi.spyOn(api, 'readReceipts');
      expect(runLifecycle(options(api, 'workflow_run')).deleted.map(({ id }) => id)).toEqual([3]);
      expect(reads).not.toHaveBeenCalled();
    },
  );

  it('rejects ambiguous warmup jobs', () => {
    const api = failedCleanupProducer();
    api.jobs?.push(warmJob(api.producer));
    const reads = vi.spyOn(api, 'readReceipts');
    expect(runLifecycle(options(api, 'workflow_run')).deleted).toEqual([]);
    expect(reads).not.toHaveBeenCalled();
  });

  it('keeps a cache if the producer attempt changes while receiving the receipt', () => {
    const api = failedCleanupProducer();
    const receipts = vi.spyOn(api, 'readReceipts');
    const read = api.read.bind(api);
    vi.spyOn(api, 'read').mockImplementation((path) =>
      receipts.mock.calls.length && path.endsWith('/actions/runs/10')
        ? run({ run_attempt: 2, status: 'in_progress', conclusion: null })
        : read(path),
    );
    expect(runLifecycle(options(api, 'workflow_run')).deleted).toEqual([]);
  });

  it('keeps a cache if a newer producer run appears while receiving the receipt', () => {
    const api = failedCleanupProducer();
    vi.spyOn(api, 'readReceipts').mockImplementation(() => {
      api.previousProducers.push(run({ id: 11, status: 'queued', conclusion: null }));
      return [receipt];
    });
    expect(runLifecycle(options(api, 'workflow_run')).deleted).toEqual([]);
  });
});

describe('producer receipt artifacts', () => {
  const origin = { runId: 10, attempt: 1, head: 'a'.repeat(40), branch: 'main', repositoryId: 101 };
  const artifact = {
    id: 70,
    name: 'cache-lifecycle-receipts-1',
    expired: false,
    size_in_bytes: 278,
    workflow_run: {
      id: origin.runId,
      head_sha: origin.head,
      head_branch: origin.branch,
      repository_id: origin.repositoryId,
      head_repository_id: origin.repositoryId,
    },
  };

  it('reads only the receipt artifact from the proven attempt and repository', () => {
    const wrongAttempt = { ...artifact, id: 71, name: 'cache-lifecycle-receipts-2' };
    const api = createGhApi('owner/repo', (args) => {
      if (args[0] === 'api') {
        expect(args.at(-1)).toBe('repos/owner/repo/actions/runs/10/artifacts?per_page=100');
        return JSON.stringify([{ total_count: 2, artifacts: [artifact, wrongAttempt] }]);
      }
      expect(args.slice(0, 5)).toEqual(['run', 'download', '10', '--name', artifact.name]);
      writeFileSync(
        join(args[args.indexOf('--dir') + 1], 'replacements.json'),
        JSON.stringify([receipt]),
      );
      return '';
    });
    expect(api.readReceipts(origin)).toEqual([receipt]);
  });

  it('rejects an artifact provided for a different head repository before download', () => {
    const unrelated = {
      ...artifact,
      workflow_run: { ...artifact.workflow_run, head_repository_id: 102 },
    };
    const call = vi.fn(() => JSON.stringify([{ total_count: 1, artifacts: [unrelated] }]));
    const api = createGhApi('owner/repo', call);
    expect(() => api.readReceipts(origin)).toThrow(/artifact origin/);
    expect(call).toHaveBeenCalledOnce();
  });
});
