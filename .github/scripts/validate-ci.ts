import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import {
  ciPlanVersion,
  requiresQuality,
  testGroups,
  type CiPlan,
  type CiRevisions,
} from './plan-ci.ts';
import { canReuseCheckEvidence, readEvent } from './pr-check-evidence.ts';

const revision = /^[a-f0-9]{40}$/;
const reasons = new Set(['docs', 'no-impact', 'affected', 'full', 'verified-revision']);

export function validatePlan(input: unknown, expected: CiRevisions, allowReuse = false): CiPlan {
  if (!input || typeof input !== 'object') throw new Error('Invalid CI plan.');
  const plan = input as Partial<CiPlan>;
  if (plan.version !== ciPlanVersion || !plan.reason || !reasons.has(plan.reason)) {
    throw new Error('Invalid CI plan.');
  }
  for (const key of ['base', 'head', 'merge'] as const) {
    if (typeof plan[key] !== 'string' || !revision.test(plan[key]) || plan[key] !== expected[key]) {
      throw new Error(`Stale CI ${key} revision.`);
    }
  }
  if (plan.reason === 'verified-revision' && !allowReuse) {
    throw new Error(
      'CI evidence reuse requires the first attempt of a text-only pull request edit.',
    );
  }
  validateSelection(plan);
  return plan as CiPlan;
}

function validateSelection({ reason, tests }: Partial<CiPlan>) {
  if (
    !Array.isArray(tests) ||
    tests.some((group) => !testGroups.includes(group)) ||
    new Set(tests).size !== tests.length
  ) {
    throw new Error('Invalid core test selection.');
  }
  const valid =
    reason === 'affected'
      ? tests.length > 0
      : tests.length === (reason === 'full' ? testGroups.length : 0);
  if (!valid) throw new Error('Core test selection does not match the CI plan.');
}

export function validateResults(
  input: unknown,
  expected: CiRevisions,
  results: Record<string, unknown>,
  allowReuse = false,
) {
  const plan = validatePlan(input, expected, allowReuse);
  if (results.plan !== 'success') throw new Error('CI planning did not succeed.');
  const required = requiresQuality(plan) ? 'success' : 'skipped';
  if (results.quality !== required) {
    throw new Error(`Unexpected quality result: ${results.quality}`);
  }
}

export function checkoutPlanInput() {
  const plan: unknown = JSON.parse(process.env.CI_PLAN ?? 'null');
  const expected = {
    base: process.env.CHANGE_BASE_SHA ?? '',
    head: process.env.CHANGE_HEAD_SHA ?? '',
    merge: process.env.CHANGE_MERGE_SHA ?? '',
  };
  const checkedOut = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (checkedOut !== expected.merge)
    throw new Error('Checked-out source differs from the CI revision.');
  return { plan, expected };
}

function main() {
  const { plan, expected } = checkoutPlanInput();
  if (process.argv[2] === '--results') {
    const results = process.env.CI_RESULTS;
    if (!results) throw new Error('The final CI gate requires job results.');
    validateResults(plan, expected, JSON.parse(results), canReuseCheckEvidence(readEvent()));
  } else validatePlan(plan, expected);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
