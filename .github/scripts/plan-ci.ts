import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { isDocumentationPath } from '../../scripts/docs-path.ts';
import { reusableCheck } from './pr-check-evidence.ts';

const revision = /^[a-f0-9]{40}$/;
const rawChange = /^:([0-7]{6}) ([0-7]{6}) [a-f0-9]{40} [a-f0-9]{40} ([ADMT])$/;
const localTools = new Set([
  '.github/dependabot.yml',
  'scripts/check-lighthouse.ts',
  'scripts/lighthouse-runtime.ts',
]);
const learningSources = new Set([
  'src/content/recognition-examples.ts',
  'src/lib/knn-quiz.ts',
  'src/lib/knn.ts',
  'src/lib/recognition-quiz.ts',
]);
const trainingSources = new Set([
  'src/lib/image-input-policy.ts',
  'src/lib/image-upload-queue.ts',
  'src/lib/image-upload.ts',
  'src/lib/mobilenet-embedding.ts',
  'src/lib/training-consent-storage.ts',
]);
const unitTest = /\.test\.(?:ts|tsx|mjs)$/;
export const ciPlanVersion = 4;
export const unitGroups = ['learning', 'training', 'tooling'] as const;
export const browserSpecs = {
  'training-browser': 'test/e2e/training.spec.ts',
  delivery: 'test/e2e/delivery.spec.ts',
} as const;
type BrowserGroup = keyof typeof browserSpecs;
type TestGroup = (typeof unitGroups)[number] | BrowserGroup;
export const testGroups = [...unitGroups, 'training-browser', 'delivery'] as const;

export interface CiRevisions {
  base: string;
  head: string;
  merge: string;
}

interface Work {
  reason: 'docs' | 'no-impact' | 'affected' | 'full' | 'verified-revision';
  tests: TestGroup[];
}

export type CiPlan = CiRevisions & Work & { version: typeof ciPlanVersion };

function affectedGroups(path: string): TestGroup[] | undefined {
  if (localTools.has(path)) return [];
  if (learningSources.has(path)) return ['learning'];
  if (trainingSources.has(path)) return ['training', 'training-browser'];
  if (unitTest.test(path)) {
    const unit = unitGroups.find((group) => path.startsWith(`test/unit/${group}/`));
    if (unit) return [unit];
  }
  const browser = (Object.keys(browserSpecs) as BrowserGroup[]).find(
    (group) => path === browserSpecs[group],
  );
  if (browser) return [browser];
}

function selectWork(changes: ReturnType<typeof readChanges>): Work {
  if (
    changes.length &&
    changes.every(({ path, document }) => document && isDocumentationPath(path))
  ) {
    return { reason: 'docs', tests: [] };
  }
  const affected = new Set<TestGroup>();
  for (const { path, regular, document } of changes) {
    if (document && isDocumentationPath(path)) continue;
    const groups = regular ? affectedGroups(path) : undefined;
    if (!groups) return fullWork();
    for (const group of groups) affected.add(group);
  }
  const tests = testGroups.filter((group) => affected.has(group));
  return { reason: tests.length ? 'affected' : 'no-impact', tests };
}

function fullWork(): Work {
  return { reason: 'full', tests: [...testGroups] };
}

export function requiresQuality({ reason }: Work) {
  return reason !== 'docs' && reason !== 'verified-revision';
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
    const document = regular || (status === 'D' && previousMode === '100644' && mode === '000000');
    changes.push({ path, regular, document });
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
  let work = fullWork();
  try {
    const ancestor = readGit(['merge-base', base, head]);
    if (!revision.test(ancestor)) throw new Error('Invalid merge base.');
    const changes = readChanges(
      readGit(['diff', '--raw', '--abbrev=40', '--no-renames', '-z', ancestor, head]),
    );
    if (changes.length && ancestor === base && sameMergeTree({ base, head, merge }, readGit)) {
      work = selectWork(changes);
    }
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
        reason: 'verified-revision',
        tests: [],
      }
    : createPlan(revisions);
  const output = process.env.GITHUB_OUTPUT;
  if (!output) throw new Error('CI requires GITHUB_OUTPUT.');
  const outputs = {
    plan: JSON.stringify(plan),
    quality: requiresQuality(plan),
  };
  for (const [key, value] of Object.entries(outputs)) {
    appendFileSync(output, `${key}=${value}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
