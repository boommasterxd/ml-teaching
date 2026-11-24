import { basename, resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { runBrowserChecks } from '../../../.github/scripts/browser-ci.ts';
import { ciPlanVersion, type CiPlan } from '../../../.github/scripts/plan-ci.ts';

const changed = 'test/e2e/quiz.spec.ts';
const core = ['test/e2e/security-headers.spec.ts', 'test/e2e/site.spec.ts'];
const full = {
  version: ciPlanVersion,
  base: 'a'.repeat(40),
  head: 'b'.repeat(40),
  merge: 'c'.repeat(40),
  reason: 'full',
  quality: true,
  browser: true,
} as const satisfies CiPlan;
const selected = { ...full, reason: 'browser-spec', spec: changed } as const satisfies CiPlan;

function discovery(paths: string[], skipped = '') {
  const specs = paths.map((file) => ({
    file: basename(file),
    tests: [{ expectedStatus: file === skipped ? 'skipped' : 'passed' }],
  }));
  return JSON.stringify({
    config: { rootDir: resolve('test/e2e') },
    suites: [{ suites: [{ specs }] }],
  });
}

describe('CI browser execution', () => {
  it('discovers the entire suite and runs the core together with exactly the changed spec', () => {
    const other = 'test/e2e/knn-quiz.spec.ts';
    const run = vi.fn<(args: string[], capture?: boolean) => string>();
    run.mockReturnValueOnce(discovery([...core, changed, other]));
    runBrowserChecks(selected, run);

    expect(run.mock.calls[0]).toEqual([['--list', '--reporter=json', '--forbid-only'], true]);
    const [args] = run.mock.calls[1];
    const [workers, focused, ...patterns] = args;
    expect([workers, focused]).toEqual(['--workers=3', '--forbid-only']);
    expect(patterns).toHaveLength(3);
    for (const file of [...core, changed]) {
      expect(patterns.some((pattern) => new RegExp(pattern).test(`/checkout/${file}`))).toBe(true);
    }
    expect(patterns.some((pattern) => new RegExp(pattern).test(`/checkout/${other}`))).toBe(false);
  });

  it('does not silently pass when core tests exist but the changed spec has no runnable tests', () => {
    const run = vi.fn().mockReturnValue(discovery([...core, changed], changed));
    expect(() => runBrowserChecks(selected, run)).toThrow(
      `No runnable browser tests in ${changed}`,
    );
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('propagates a failing Playwright execution to its job', () => {
    const run = vi.fn().mockReturnValueOnce(discovery([...core, changed]));
    run.mockImplementationOnce(() => {
      throw new Error('A selected test failed.');
    });
    expect(() => runBrowserChecks(selected, run)).toThrow('A selected test failed.');
  });

  it('executes the full default Playwright suite without file filters on a general plan', () => {
    const run = vi.fn();
    runBrowserChecks(full, run);
    expect(run.mock.calls).toEqual([[['--workers=3', '--forbid-only']]]);
  });
});
