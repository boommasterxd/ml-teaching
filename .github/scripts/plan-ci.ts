import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { reusableCheck } from './pr-check-evidence.ts';

const revision = /^[a-f0-9]{40}$/;
const unitTest = /^test\/unit\/.+\.test\.(?:ts|tsx|mjs)$/;
const localTools = new Set(['scripts/check-lighthouse.ts', 'scripts/lighthouse-runtime.ts']);
const browserSpec = /^test\/e2e\/[a-z0-9][a-z0-9-]*\.spec\.ts$/;
const rawChange = /^:([0-7]{6}) ([0-7]{6}) [a-f0-9]{40} [a-f0-9]{40} ([ADMT])$/;
export const ciPlanVersion = 3;

export interface CiRevisions {
  base: string;
  head: string;
  merge: string;
}

interface GeneralWork {
  quality: boolean;
  browser: boolean;
  reason: 'docs' | 'unit-tests' | 'local-tooling' | 'full' | 'verified-revision';
}

interface SelectedBrowserWork {
  quality: true;
  browser: true;
  reason: 'browser-spec';
  spec: string;
}

type Work = GeneralWork | SelectedBrowserWork;
export type CiPlan = CiRevisions & Work & { version: typeof ciPlanVersion };

export function isBrowserSpec(path: unknown): path is string {
  return typeof path === 'string' && path.endsWith('.spec.ts') && browserSpec.test(path);
}

export function selectWork(paths: readonly string[]): GeneralWork {
  if (paths.length > 0 && paths.every((path) => path.startsWith('docs/'))) {
    return { quality: false, browser: false, reason: 'docs' };
  }
  if (paths.length > 0 && paths.every((path) => unitTest.test(path))) {
    return { quality: true, browser: false, reason: 'unit-tests' };
  }
  if (paths.length > 0 && paths.every((path) => localTools.has(path) || unitTest.test(path))) {
    return { quality: true, browser: false, reason: 'local-tooling' };
  }
  return { quality: true, browser: true, reason: 'full' };
}

function git(args: string[]) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    timeout: 10_000,
    maxBuffer: 8 * 1024 * 1024,
  }).trimEnd();
}

function readChanges(diff: string) {
  if (!diff) return [];
  const fields = diff.split('\0');
  if (fields.pop() !== '' || fields.length % 2 !== 0) throw new Error('Invalid CI diff.');

  const changes = [];
  for (let index = 0; index < fields.length; index += 2) {
    const change = rawChange.exec(fields[index]);
    const path = fields[index + 1];
    if (!change || !path) throw new Error('Invalid CI change.');
    const [, previousMode, mode, status] = change;
    const regular =
      mode === '100644' &&
      ((status === 'A' && previousMode === '000000') || (status === 'M' && previousMode === mode));
    changes.push({ path, regular });
  }
  return changes;
}

function sameMergeTree({ base, head, merge }: CiRevisions, readGit: typeof git) {
  if (readGit(['rev-list', '--parents', '-n', '1', merge]).trim() !== `${merge} ${base} ${head}`) {
    return false;
  }
  const [headTree, mergeTree] = readGit(['rev-parse', `${head}^{tree}`, `${merge}^{tree}`])
    .trim()
    .split('\n');
  return revision.test(headTree) && headTree === mergeTree;
}

export function createPlan({ base, head, merge }: CiRevisions, readGit = git): CiPlan {
  if (![base, head, merge].every((value) => revision.test(value))) {
    throw new Error('CI requires complete base, head and merge revisions.');
  }
  let work: Work = selectWork([]);
  try {
    const ancestor = readGit(['merge-base', base, head]);
    if (!revision.test(ancestor)) throw new Error('Invalid merge base.');
    const changes = readChanges(
      readGit(['diff', '--raw', '--abbrev=40', '--no-renames', '-z', ancestor, head]),
    );
    const [change] = changes;
    work =
      changes.length === 1 &&
      change.regular &&
      isBrowserSpec(change.path) &&
      ancestor === base &&
      sameMergeTree({ base, head, merge }, readGit)
        ? { quality: true, browser: true, reason: 'browser-spec', spec: change.path }
        : selectWork(changes.map(({ path }) => path));
  } catch {
    // Missing history or an oversized diff must select all work.
  }
  return { version: ciPlanVersion, base, head, merge, ...work };
}

async function main() {
  const revisions = {
    base: process.env.CHANGE_BASE_SHA ?? '',
    head: process.env.CHANGE_HEAD_SHA ?? '',
    merge: git(['rev-parse', 'HEAD']),
  };
  if (revisions.merge !== process.env.CHANGE_MERGE_SHA) {
    throw new Error('Checked-out source differs from the CI revision.');
  }
  const plan: CiPlan = (await reusableCheck('ci', revisions))
    ? {
        version: ciPlanVersion,
        ...revisions,
        quality: false,
        browser: false,
        reason: 'verified-revision',
      }
    : createPlan(revisions);
  const output = process.env.GITHUB_OUTPUT;
  if (!output) throw new Error('CI requires GITHUB_OUTPUT.');
  for (const [key, value] of Object.entries({ plan: JSON.stringify(plan), ...plan })) {
    appendFileSync(output, `${key}=${value}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
