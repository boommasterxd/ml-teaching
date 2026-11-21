import { execFileSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';

const revision = /^[a-f0-9]{40}$/;
const qualityScripts = new Set([
  'lint',
  'format',
  'format:check',
  'typecheck',
  'check:boundaries',
  'check:quality',
  'check:dead-code',
  'check:duplication',
  'audit',
  'audit:production',
  'test',
  'test:watch',
  'test:coverage',
  'test:e2e',
  'test:lighthouse',
  'ci',
  'ui:audit',
  'ui:info',
  'skills:list',
]);
const nonRuntime = [
  /^docs\/.+\.md$/,
  /^(?:README|AGENTS)\.md$/,
  /^test\/(?:unit|e2e)\/.+\.(?:ts|tsx|mjs)$/,
  /^test\/setup\.ts$/,
  /^\.github\/workflows\/(?:ci|commit-style-check|dependabot-auto-merge|gitleaks|update-gitleaks)\.yml$/,
  /^\.github\/(?:dependabot\.yml|gitleaks(?:-version\.json|\.toml))$/,
  /^\.github\/scripts\/(?:plan-ci|validate-ci)\.ts$/,
];

type ReadGit = (args: string[]) => string;

function git(args: string[]) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    timeout: 5_000,
    maxBuffer: 256 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function qualityManifest(before: string, after: string) {
  const previous: unknown = JSON.parse(before);
  const current: unknown = JSON.parse(after);
  if (!isRecord(previous) || !isRecord(current)) return false;
  const { scripts: oldScripts, ...oldFields } = previous;
  const { scripts: newScripts, ...newFields } = current;
  if (!isDeepStrictEqual(oldFields, newFields)) return false;
  if (!isRecord(oldScripts) || !isRecord(newScripts)) return false;
  const names = new Set([...Object.keys(oldScripts), ...Object.keys(newScripts)]);
  return [...names].every(
    (name) =>
      isDeepStrictEqual(oldScripts[name], newScripts[name]) ||
      (qualityScripts.has(name) &&
        (oldScripts[name] === undefined || typeof oldScripts[name] === 'string') &&
        (newScripts[name] === undefined || typeof newScripts[name] === 'string')),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function classifyBuild(previous: string, current: string, readGit: ReadGit) {
  if (!previous) return 'previous-revision-missing';
  if (!current) return 'current-revision-missing';
  if (!revision.test(previous) || !revision.test(current)) return 'invalid-revision';

  let failureReason = 'checkout-read-failed';
  try {
    if (readGit(['rev-parse', 'HEAD']).trim() !== current) return 'checkout-mismatch';
    failureReason = 'ancestry-check-failed';
    readGit(['merge-base', '--is-ancestor', previous, current]);
    failureReason = 'diff-read-failed';
    const output = readGit(['diff', '--name-only', '--no-renames', '-z', previous, current]);
    if (!output) return 'empty-diff';
    if (!output.endsWith('\0')) return 'invalid-diff';

    failureReason = 'manifest-check-failed';
    const paths = output.slice(0, -1).split('\0');
    const safe = paths.every((path) => {
      if (path === 'package.json') {
        return qualityManifest(
          readGit(['show', `${previous}:package.json`]),
          readGit(['show', `${current}:package.json`]),
        );
      }
      return nonRuntime.some((pattern) => pattern.test(path));
    });
    return safe ? 'non-runtime-diff' : 'unclassified-or-runtime-change';
  } catch {
    return failureReason;
  }
}

/** Return Vercel's skip code only for a complete, verified non-runtime delta. */
export function ignoreBuild(
  previous: string,
  current: string,
  readGit: ReadGit = git,
  report?: (reason: string) => void,
): 0 | 1 {
  const reason = classifyBuild(previous, current, readGit);
  report?.(reason);
  return reason === 'non-runtime-diff' ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = ignoreBuild(
    process.env.VERCEL_GIT_PREVIOUS_SHA ?? '',
    process.env.VERCEL_GIT_COMMIT_SHA ?? '',
    git,
    (reason) => console.log(`[ignore-build] ${reason}`),
  );
}
