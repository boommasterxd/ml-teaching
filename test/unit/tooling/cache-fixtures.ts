import type {
  Api,
  Cache,
  Options,
  Policy,
  Run,
} from '../../../.github/scripts/cache-lifecycle/types';

const head = 'a'.repeat(40);
const repository = { id: 101, full_name: 'owner/project' };
export const previousHead = 'b'.repeat(40);
const receipt = { family: 'npm', prefix: 'npm-cache-linux-', key: 'npm-cache-linux-new' };
const policy: Policy = {
  schemaVersion: 1,
  repository: 'owner/project',
  defaultBranch: 'main',
  producerWorkflows: [{ name: 'Warm', path: '.github/workflows/warm.yml', job: 'warm' }],
  producerInputs: ['package-lock.json', '.github/workflows/warm.yml'],
  families: { npm: 'npm-cache-' },
  codeqlWorkflows: [],
  retiredPrefixes: [],
};

export function cache(id: number, key: string, ref = 'refs/heads/main', newer = false): Cache {
  const date = newer ? '2026-02-01T00:00:00Z' : '2026-01-01T00:00:00Z';
  return {
    id,
    key,
    ref,
    version: 'v1',
    size_in_bytes: 100,
    created_at: date,
    last_accessed_at: date,
  };
}

export function run(overrides: Partial<Run> = {}): Run {
  return {
    id: 10,
    name: 'Warm',
    path: '.github/workflows/warm.yml',
    head_sha: head,
    head_branch: 'main',
    event: 'push',
    status: 'completed',
    conclusion: 'success',
    run_attempt: 1,
    workflow_id: 11,
    repository,
    head_repository: repository,
    ...overrides,
  };
}

function warmJob(source: Run) {
  return {
    name: 'warm',
    status: 'completed',
    conclusion: 'success',
    run_id: source.id,
    run_attempt: source.run_attempt,
    head_sha: source.head_sha,
  };
}

export class FixtureApi implements Api {
  caches: Cache[] = [];
  runs: Run[] = [];
  private readonly producer = run();
  triggering = run({ id: 20, name: 'CI', path: '.github/workflows/ci.yml' });
  prs: Record<number, { state: string; head: { sha: string; ref: string } }> = {};
  removed: number[] = [];

  read(path: string): unknown {
    if (path === 'repos/owner/project')
      return { full_name: 'owner/project', default_branch: 'main' };
    if (path.includes('/git/ref/heads/')) return { object: { sha: head } };
    if (path.includes('/pulls/')) return this.prs[Number(path.split('/').at(-1))];
    if (path.includes('/compare/'))
      return {
        total_commits: 1,
        ahead_by: 1,
        status: 'ahead',
        commits: [{ sha: head }],
        base_commit: { sha: previousHead },
        merge_base_commit: { sha: previousHead },
        files: [{ filename: 'src/app.ts' }],
      };
    const repositoryRuns = path.includes('/actions/runs?');
    if (repositoryRuns || path.includes('/actions/workflows/warm.yml/runs?'))
      return { total_count: 1, workflow_runs: [this.producer] };
    if (path.endsWith('/actions/runs/10')) return this.producer;
    if (path.endsWith('/actions/runs/20')) return this.triggering;
    throw new Error(`Unexpected read: ${path}`);
  }

  list(path: string): unknown[] {
    if (path.includes('/actions/caches?')) return this.caches.map((item) => ({ ...item }));
    if (path.includes('/jobs?')) return [warmJob(this.producer)];
    if (path.includes('/actions/runs?status=')) {
      const status = new URLSearchParams(path.split('?')[1]).get('status');
      return this.runs.filter((item) => item.status === status);
    }
    throw new Error(`Unexpected list: ${path}`);
  }

  remove(id: number): void {
    this.removed.push(id);
    this.caches = this.caches.filter((item) => item.id !== id);
  }

  readReceipts: Api['readReceipts'] = () => [receipt];
}

export function options(api: FixtureApi, eventName = 'push'): Options {
  return {
    api,
    policy: structuredClone(policy),
    repository: 'owner/project',
    eventName,
    event: eventName === 'workflow_run' ? { action: 'completed', workflow_run: { id: 20 } } : {},
    runId: 10,
    runNumber: 1,
    ref: 'refs/heads/main',
    sha: head,
    workflow: 'Warm',
    checkoutSha: head,
    replacements: [receipt],
  };
}

export function generations(api: FixtureApi): void {
  api.caches = [cache(1, 'npm-cache-linux-old'), cache(2, receipt.key, 'refs/heads/main', true)];
}
