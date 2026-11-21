import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync('.github/workflows/update-gitleaks.yml', 'utf8');
const command = workflow.split('        run: |\n')[1]?.replace(/^ {10}/gm, '');

function runBranchLookup(status: number) {
  if (!command) throw new Error('Missing scanner updater command');

  const directory = mkdtempSync(path.join(tmpdir(), 'gitleaks-updater-'));
  try {
    mkdirSync(path.join(directory, '.github'));
    writeFileSync(path.join(directory, '.github/gitleaks-version.json'), '{"version":"8.30.1"}');
    return spawnSync(
      'bash',
      [
        '-c',
        `
      authenticated=false
      gh() {
        [[ "$*" == "auth setup-git" ]] || return 99
        authenticated=true
      }
      timeout() { shift; "$@"; }
      git() {
        [[ "$*" == "ls-remote --exit-code --heads origin refs/heads/chore/gitleaks-999.0.0" ]] || return 99
        [[ "$authenticated" == true ]] || return 128
        return "$LOOKUP_STATUS"
      }
      curl() {
        case "$*" in
          */releases/latest) printf '%s\\n' '{"tag_name":"v999.0.0"}' ;;
          */gitleaks_999.0.0_checksums.txt) echo "Checksum requested" >&2; return 1 ;;
          *) return 99 ;;
        esac
      }
      ${command}
      `,
      ],
      {
        cwd: directory,
        encoding: 'utf8',
        timeout: 5000,
        env: {
          NODE_ENV: 'test',
          PATH: process.env.PATH,
          LOOKUP_STATUS: String(status),
          RUNNER_TEMP: directory,
        },
      },
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe('Gitleaks updater branch lookup', () => {
  it('stops successfully when an authenticated lookup finds the update branch', () => {
    const result = runBranchLookup(0);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('Branch exists.');
    expect(result.stderr).not.toContain('Checksum requested');
  });

  it('proceeds to the checksum only when the update branch is absent', () => {
    const result = runBranchLookup(2);
    expect(result.status, result.stderr).toBe(1);
    expect(result.stderr).toContain('Checksum requested');
  });

  it('stops on a failed remote lookup before preparing an update', () => {
    const result = runBranchLookup(128);
    expect(result.status, result.stderr).toBe(128);
    expect(result.stderr).toContain('Could not check the remote update branch');
    expect(result.stderr).not.toContain('Checksum requested');
  });
});
