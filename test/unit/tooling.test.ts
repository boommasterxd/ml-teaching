import { describe, expect, it } from 'vitest';
import { createPlan, selectWork } from '../../.github/scripts/plan-ci.ts';
import { validatePlan, validateResults } from '../../.github/scripts/validate-ci.ts';

const revisions = { base: 'a'.repeat(40), head: 'b'.repeat(40), merge: 'c'.repeat(40) };
describe('CI selection and required gate', () => {
  it('skips costly work only for a complete nonempty documentation diff', () => {
    expect(selectWork(['docs/architecture.md'])).toEqual({
      quality: false,
      browser: false,
      reason: 'docs',
    });
    expect(selectWork(['docs/architecture.md', 'src/app/page.tsx']).browser).toBe(true);
    expect(selectWork([]).browser).toBe(true);
    expect(selectWork(['test/unit/hooks/useModelLoader.test.ts'])).toEqual({
      quality: true,
      browser: false,
      reason: 'unit-tests',
    });
    expect(
      selectWork(['test/unit/hooks/useModelLoader.test.ts', 'package-lock.json']).browser,
    ).toBe(true);
  });

  it('uses the whole merge-base diff and falls back to all work for missing history', () => {
    const reads: string[][] = [];
    const plan = createPlan(revisions, (args: string[]) => {
      reads.push(args);
      return reads.length === 1 ? revisions.base : 'docs/architecture.md\0src/app/page.tsx\0';
    });
    expect(reads[1]).toEqual([
      'diff',
      '--name-only',
      '--no-renames',
      '-z',
      revisions.base,
      revisions.head,
    ]);
    expect(plan.browser).toBe(true);
    expect(
      createPlan(revisions, () => {
        throw new Error('Missing history');
      }).reason,
    ).toBe('full');
    expect(() => createPlan({ ...revisions, head: 'truncated' })).toThrow();
  });

  it('rejects failed planning, selected failures, unexpected skips and stale plans', () => {
    const plan = { version: 1, ...revisions, ...selectWork(['src/app/page.tsx']) };
    expect(() =>
      validateResults(plan, revisions, { plan: 'success', quality: 'success', browser: 'success' }),
    ).not.toThrow();
    for (const results of [
      { plan: 'failure', quality: 'success', browser: 'success' },
      { plan: 'success', quality: 'failure', browser: 'success' },
      { plan: 'success', quality: 'success', browser: 'skipped' },
      { plan: 'success', quality: 'cancelled', browser: 'success' },
    ])
      expect(() => validateResults(plan, revisions, results)).toThrow();
    expect(() => validatePlan({ ...plan, head: 'd'.repeat(40) }, revisions)).toThrow();
    expect(() => validatePlan({ ...plan, browser: false }, revisions)).toThrow();
    const docsPlan = { version: 1, ...revisions, ...selectWork(['docs/architecture.md']) };
    expect(() =>
      validateResults(docsPlan, revisions, {
        plan: 'success',
        quality: 'skipped',
        browser: 'skipped',
      }),
    ).not.toThrow();
    expect(() =>
      validateResults(docsPlan, revisions, {
        plan: 'success',
        quality: 'success',
        browser: 'skipped',
      }),
    ).toThrow();
    expect(() => validatePlan(null, revisions)).toThrow();
    expect(() => validatePlan({ ...plan, reason: 'unknown' }, revisions)).toThrow();
  });
});
