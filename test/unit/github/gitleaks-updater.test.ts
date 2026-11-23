import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempDisposableSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync('.github/workflows/update-gitleaks.yml', 'utf8');
const command = workflow.split('        run: |\n')[1]?.replace(/^ {10}/gm, '');
const updateRef = 'refs/heads/chore/gitleaks-999.0.0';
const manifest = '.github/gitleaks-version.json';
const checksum = 'a'.repeat(64);
const gitEnv: NodeJS.ProcessEnv = {
  NODE_ENV: 'test',
  PATH: process.env.PATH,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_ALLOW_PROTOCOL: 'file',
};

function withUpdater(test: (fixture: ReturnType<typeof createFixture>) => void) {
  using directory = mkdtempDisposableSync(path.join(tmpdir(), 'gitleaks-updater-'));
  test(createFixture(directory.path));
}

function createFixture(directory: string) {
  const remote = path.join(directory, 'remote.git');
  const repository = path.join(directory, 'checkout');
  execFileSync('git', ['init', '-q', '--bare', '--initial-branch=main', remote], { env: gitEnv });
  execFileSync('git', ['init', '-q', '--initial-branch=main', repository], { env: gitEnv });
  const git = (...args: string[]) =>
    execFileSync('git', args, {
      cwd: repository,
      env: gitEnv,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  const write = (file: string, contents: string) =>
    writeFileSync(path.join(repository, file), contents);
  git('remote', 'add', 'origin', remote);
  git('config', 'user.name', 'Test');
  git('config', 'user.email', 'test@example.invalid');
  mkdirSync(path.join(repository, '.github'));
  write(manifest, '{"version":"8.30.1","sha256":"old"}\n');
  git('add', manifest);
  git('commit', '-qm', 'Initial manifest');
  git('push', '-q', 'origin', 'main');
  return {
    git,
    write,
    run: (env: Record<string, string> = {}) => runUpdater(repository, directory, env),
  };
}

function runUpdater(repository: string, directory: string, fixtureEnv: Record<string, string>) {
  if (!command) throw new Error('Missing scanner updater command');
  return spawnSync(
    'bash',
    [
      '-c',
      `
      gh() {
        case "$1 $2" in
          'api --method')
            [[ "$3 $4" == 'GET repos/owner/project/pulls' ]] || return 99
            [[ "$*" == *'head=owner:chore/gitleaks-999.0.0'* && "$*" == *'base=main'* ]] || return 99
            printf '%s\\n' "$PR_LIST"
            return "$LIST_STATUS"
            ;;
          'auth setup-git') ;;
          'pr create')
            [[ "$*" == *'--repo owner/project'* && "$*" == *'--head chore/gitleaks-999.0.0'* ]] || return 99
            echo 'Creating update PR'
            return "$CREATE_STATUS"
            ;;
          *) return 99 ;;
        esac
      }
      curl() {
        case "$*" in
          */releases/latest) printf '%s\\n' '{"tag_name":"v999.0.0"}' ;;
          */gitleaks_999.0.0_checksums.txt) printf '%s  %s\\n' '${checksum}' 'gitleaks_999.0.0_linux_x64.tar.gz' ;;
          *) return 99 ;;
        esac
      }
      export -f gh curl
      timeout() { shift; "$@"; }
      ${command}
      `,
    ],
    {
      cwd: repository,
      encoding: 'utf8',
      timeout: 5000,
      env: {
        ...gitEnv,
        GITHUB_REPOSITORY: 'owner/project',
        DEFAULT_BRANCH: 'main',
        RUNNER_TEMP: directory,
        PR_LIST: '[]',
        LIST_STATUS: '0',
        CREATE_STATUS: '0',
        ...fixtureEnv,
      },
    },
  );
}

describe('Gitleaks updater recovery', () => {
  it('reuses the exact branch after a failed PR creation and later main changes', () => {
    withUpdater(({ git, run, write }) => {
      const failed = run({ CREATE_STATUS: '1' });
      expect(failed.status, failed.stderr).toBe(1);
      expect(failed.stdout).toContain('Creating update PR');
      const remoteBeforeRecovery = git('ls-remote', 'origin', updateRef);
      expect(remoteBeforeRecovery).toContain(updateRef);
      git('checkout', '-q', 'main');
      write('README.md', 'An unrelated main change\n');
      git('add', 'README.md');
      git('commit', '-qm', 'Advance main');
      git('push', '-q', 'origin', 'main');
      const recovered = run();
      expect(recovered.status, recovered.stderr).toBe(0);
      expect(recovered.stdout).toContain('Creating update PR');
      expect(git('ls-remote', 'origin', updateRef)).toBe(remoteBeforeRecovery);
      expect(git('branch', '--show-current')).toBe('main');
    });
  });

  it('does not open a duplicate when an update PR already exists', () => {
    withUpdater(({ git, run }) => {
      const result = run({ PR_LIST: '[{"number":1}]' });
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain('An update PR is already open.');
      expect(result.stdout).not.toContain('Creating update PR');
      expect(git('ls-remote', 'origin', updateRef)).toBe('');
    });
  });

  it.each(['extra file', 'wrong checksum'])('does not publish a branch with %s', (problem) => {
    withUpdater(({ git, run, write }) => {
      const manifestChecksum = problem === 'wrong checksum' ? 'b'.repeat(64) : checksum;
      git('checkout', '-qb', 'invalid-update');
      write(
        manifest,
        JSON.stringify({ version: '999.0.0', sha256: manifestChecksum }, null, 2) + '\n',
      );
      if (problem === 'extra file') write('README.md', 'Unexpected branch content\n');
      git('add', '.');
      git('commit', '-qm', 'Invalid release branch');
      git('push', '-q', 'origin', `HEAD:${updateRef}`);
      git('checkout', '-q', 'main');
      const result = run();
      expect(result.status, result.stderr).toBe(1);
      expect(result.stderr).toContain('Existing update branch does not match');
      expect(result.stdout).not.toContain('Creating update PR');
    });
  });

  it('does not push a branch when the open PR lookup fails', () => {
    withUpdater(({ git, run }) => {
      const result = run({ LIST_STATUS: '69' });
      expect(result.status, result.stderr).toBe(69);
      expect(git('ls-remote', 'origin', updateRef)).toBe('');
    });
  });
});
