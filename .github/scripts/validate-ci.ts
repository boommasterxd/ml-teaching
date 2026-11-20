import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import type { CiPlan, CiRevisions } from './plan-ci.ts';

const revision = /^[a-f0-9]{40}$/;
const reasons = new Set(['docs', 'unit-tests', 'full']);

export function validatePlan(input: unknown, expected: CiRevisions): CiPlan {
  if (!input || typeof input !== 'object') throw new Error('Invalid CI plan.');
  const plan = input as Partial<CiPlan>;
  if (plan.version !== 1 || !plan.reason || !reasons.has(plan.reason)) {
    throw new Error('Invalid CI plan.');
  }
  for (const key of ['base', 'head', 'merge'] as const) {
    if (typeof plan[key] !== 'string' || !revision.test(plan[key]) || plan[key] !== expected[key]) {
      throw new Error(`Stale CI ${key} revision.`);
    }
  }
  const quality = plan.reason !== 'docs';
  const browser = plan.reason === 'full';
  if (plan.quality !== quality || plan.browser !== browser) {
    throw new Error('CI work does not match its declared scope.');
  }
  return plan as CiPlan;
}

export function validateResults(
  input: unknown,
  expected: CiRevisions,
  results: Record<string, unknown>,
) {
  const plan = validatePlan(input, expected);
  if (results.plan !== 'success') throw new Error('CI planning did not succeed.');
  for (const name of ['quality', 'browser'] as const) {
    const required = plan[name] ? 'success' : 'skipped';
    if (results[name] !== required) throw new Error(`Unexpected ${name} result: ${results[name]}`);
  }
}

function main() {
  const plan: unknown = JSON.parse(process.env.CI_PLAN ?? 'null');
  const expected = {
    base: process.env.CHANGE_BASE_SHA ?? '',
    head: process.env.CHANGE_HEAD_SHA ?? '',
    merge: process.env.CHANGE_MERGE_SHA ?? '',
  };
  const checkedOut = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (checkedOut !== expected.merge)
    throw new Error('Checked-out source differs from the CI revision.');
  if (process.env.CI_RESULTS) validateResults(plan, expected, JSON.parse(process.env.CI_RESULTS));
  else validatePlan(plan, expected);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
