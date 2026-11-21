import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { ignoreBuild } from '../../../scripts/ignore-build';

const previous = 'a'.repeat(40);
const current = 'b'.repeat(40);

function history(paths: string[], manifests = ['{}', '{}']) {
  return (args: string[]) => {
    if (args[0] === 'rev-parse') return `${current}\n`;
    if (args[0] === 'merge-base') return '';
    if (args[0] === 'show') return manifests[args[1].startsWith(previous) ? 0 : 1];
    return paths.length ? `${paths.join('\0')}\0` : '';
  };
}

describe('Vercel build admission', () => {
  it.each([
    ['docs/deployment.md'],
    ['README.md', 'AGENTS.md'],
    ['test/unit/hooks/useModelLoader.test.ts', 'test/setup.ts'],
    ['.github/workflows/ci.yml', '.github/scripts/plan-ci.ts'],
  ])('skips proven non-runtime changes: %s', (...paths) => {
    expect(ignoreBuild(previous, current, history(paths))).toBe(0);
  });

  it.each([
    [],
    ['src/app/page.tsx'],
    ['docs/guide.md', 'src/app/page.tsx'],
    ['docs/guide.md', 'scripts/unknown.ts'],
    ['docs/guide.md', 'docs/model.json'],
    ['.github/scripts/unknown.ts'],
    ['next.config.mjs'],
    ['package-lock.json'],
    ['test/fixtures/production-input.json'],
  ])('builds empty, runtime, mixed and unknown changes: %s', (...paths) => {
    expect(ignoreBuild(previous, current, history(paths))).toBe(1);
  });

  it('retains runtime changes preceding later documentation after a failed deployment', () => {
    const readGit = (args: string[]) => {
      if (args[0] === 'diff') {
        expect(args.slice(-2)).toEqual([previous, current]);
        return 'src/app/page.tsx\0docs/deployment.md\0';
      }
      return history([])(args);
    };
    expect(ignoreBuild(previous, current, readGit)).toBe(1);
  });

  it('treats a runtime-to-docs rename as deletion plus addition', () => {
    expect(ignoreBuild(previous, current, history(['src/lib/old.ts', 'docs/old.md']))).toBe(1);
  });

  it('skips quality-script-only changes while preserving every other manifest member', () => {
    const manifests = [
      JSON.stringify({ private: true, scripts: { build: 'next build', lint: 'eslint .' } }),
      JSON.stringify({
        scripts: { lint: 'eslint . --max-warnings 0', build: 'next build' },
        private: true,
      }),
    ];
    expect(ignoreBuild(previous, current, history(['package.json'], manifests))).toBe(0);
  });

  it.each([
    { scripts: { build: 'other' } },
    { scripts: { prebuild: 'other' } },
    { scripts: { unknown: 'other' } },
    { scripts: { lint: 1 } },
    { scripts: {}, engines: { node: '28.x' } },
    { scripts: {}, dependencies: { next: '99' } },
    [],
    null,
  ])('builds consequential or invalid manifest changes: %j', (manifest) => {
    expect(
      ignoreBuild(
        previous,
        current,
        history(['package.json'], ['{"scripts":{}}', JSON.stringify(manifest)]),
      ),
    ).toBe(1);
  });

  it('builds when manifests are unreadable or malformed', () => {
    expect(ignoreBuild(previous, current, history(['package.json'], ['{', '{}']))).toBe(1);
  });

  it('prints one fixed reason and builds when the provider passes a malformed revision', () => {
    const result = spawnSync(process.execPath, ['scripts/ignore-build.ts'], {
      encoding: 'utf8',
      timeout: 5_000,
      env: {
        NODE_ENV: 'test',
        VERCEL_GIT_PREVIOUS_SHA: previous,
        VERCEL_GIT_COMMIT_SHA: 'unexpected\nvalue',
      },
    });
    expect(result.status).toBe(1);
    expect(result.stdout.trimEnd()).toBe('[ignore-build] invalid-revision');
    expect(result.stderr).toBe('');
  });

  it('reports a fixed ancestry failure reason without forwarding Git error text', () => {
    const reasons: string[] = [];
    const readGit = (args: string[]) => {
      if (args[0] === 'merge-base') throw new Error('unexpected Git error text');
      return history(['README.md'])(args);
    };
    expect(ignoreBuild(previous, current, readGit, (reason) => reasons.push(reason))).toBe(1);
    expect(reasons).toEqual(['ancestry-check-failed']);
  });

  it('builds when revisions are missing or invalid, the checkout differs, or the diff is truncated', () => {
    expect(ignoreBuild('', current, history(['README.md']))).toBe(1);
    expect(ignoreBuild(previous, 'invalid', history(['README.md']))).toBe(1);
    expect(ignoreBuild(previous, current, () => 'different')).toBe(1);
    expect(
      ignoreBuild(previous, current, (args) =>
        args[0] === 'diff' ? 'README.md' : history([])(args),
      ),
    ).toBe(1);
  });
});
