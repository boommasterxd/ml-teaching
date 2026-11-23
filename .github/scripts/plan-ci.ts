import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { reusableCheck } from './pr-check-evidence.ts';

const revision = /^[a-f0-9]{40}$/;
const unitTest = /^test\/unit\/.+\.test\.(?:ts|tsx|mjs)$/;

export interface CiRevisions {
  base: string;
  head: string;
  merge: string;
}

interface Work {
  quality: boolean;
  browser: boolean;
  reason: 'docs' | 'unit-tests' | 'full' | 'verified-revision';
}

export interface CiPlan extends CiRevisions, Work {
  version: 1;
}

export function selectWork(paths: readonly string[]): Work {
  if (paths.length > 0 && paths.every((path) => path.startsWith('docs/'))) {
    return { quality: false, browser: false, reason: 'docs' };
  }
  if (paths.length > 0 && paths.every((path) => unitTest.test(path))) {
    return { quality: true, browser: false, reason: 'unit-tests' };
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

export function createPlan({ base, head, merge }: CiRevisions, readGit = git): CiPlan {
  if (![base, head, merge].every((value) => revision.test(value))) {
    throw new Error('CI requires complete base, head and merge revisions.');
  }
  let work = selectWork([]);
  try {
    const ancestor = readGit(['merge-base', base, head]);
    if (!revision.test(ancestor)) throw new Error('Invalid merge base.');
    const paths = readGit(['diff', '--name-only', '--no-renames', '-z', ancestor, head])
      .split('\0')
      .filter(Boolean);
    work = selectWork(paths);
  } catch {
    // Missing history or an oversized diff must select all work.
  }
  return { version: 1, base, head, merge, ...work };
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
    ? { version: 1, ...revisions, quality: false, browser: false, reason: 'verified-revision' }
    : createPlan(revisions);
  const output = process.env.GITHUB_OUTPUT;
  if (!output) throw new Error('CI requires GITHUB_OUTPUT.');
  for (const [key, value] of Object.entries({ plan: JSON.stringify(plan), ...plan })) {
    appendFileSync(output, `${key}=${value}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
