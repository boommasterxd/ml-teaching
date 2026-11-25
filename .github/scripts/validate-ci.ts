import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ciPlanVersion, isBrowserSpec, type CiPlan, type CiRevisions } from './plan-ci.ts';
import { canReuseCheckEvidence, readEvent } from './pr-check-evidence.ts';

const revision = /^[a-f0-9]{40}$/;
const qualityOnlyReasons = ['unit-tests', 'local-tooling'];
const reasons = new Set([
  'docs',
  'browser-spec',
  'full',
  'verified-revision',
  ...qualityOnlyReasons,
]);

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
  const selectedSpec = plan.reason === 'browser-spec';
  if (selectedSpec ? !('spec' in plan && isBrowserSpec(plan.spec)) : 'spec' in plan) {
    throw new Error('Invalid browser selection for the CI plan.');
  }
  const browser = plan.reason === 'full' || selectedSpec;
  const quality = browser || qualityOnlyReasons.includes(plan.reason);
  if (plan.quality !== quality || plan.browser !== browser) {
    throw new Error('CI work does not match its declared scope.');
  }
  return plan as CiPlan;
}

export function validateResults(
  input: unknown,
  expected: CiRevisions,
  results: Record<string, unknown>,
  allowReuse = false,
) {
  const plan = validatePlan(input, expected, allowReuse);
  if (results.plan !== 'success') throw new Error('CI planning did not succeed.');
  for (const name of ['quality', 'browser'] as const) {
    const required = plan[name] ? 'success' : 'skipped';
    if (results[name] !== required) throw new Error(`Unexpected ${name} result: ${results[name]}`);
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
