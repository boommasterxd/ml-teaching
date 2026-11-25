import { basename, resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { readBrowserSlot, runBrowserChecks } from '../../../.github/scripts/browser-ci.ts';
import { ciPlanVersion, type CiPlan } from '../../../.github/scripts/plan-ci.ts';

const changed = 'test/e2e/hero-entry.spec.ts';
const other = 'test/e2e/error-recovery-navigation.spec.ts';
const everyday = { file: 'test/e2e/quiz.spec.ts', title: 'Everyday quiz', line: 43, tagged: true };
const neighbors = { file: 'test/e2e/knn-quiz.spec.ts', title: 'KNN quiz', line: 269, tagged: true };
const otherKnn = { file: neighbors.file, title: 'KNN secondary flow', line: 394 };
const requiredConsent = 'test/e2e/training-bfcache.spec.ts';
const core = [
  'test/e2e/security-headers.spec.ts',
  'test/e2e/site.spec.ts',
  'test/e2e/initial-content.spec.ts',
  'test/e2e/intent-navigation.spec.ts',
  requiredConsent,
];
const coreCases = [...core, everyday, neighbors];
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
const list = ['--list', '--reporter=json', '--forbid-only'];
const execute = ['--workers=2', '--forbid-only', '--reporter=line,json'];

type Status = 'passed' | 'skipped' | 'failed';
type Case = {
  file: string;
  title?: string;
  expectedStatus?: Status;
  result?: Status;
  skipReason?: string;
  line?: number;
  tagged?: boolean;
};

function report(cases: (string | Case)[]) {
  const specs = cases.map((entry) => {
    const {
      file,
      title = basename(file),
      expectedStatus = 'passed',
      result,
      skipReason,
      line = 1,
      tagged = false,
    } = typeof entry === 'string' ? { file: entry } : entry;
    return {
      file: basename(file),
      id: title,
      title,
      tags: tagged ? ['ci'] : [],
      line,
      column: 1,
      tests: [
        {
          projectId: 'chromium',
          expectedStatus,
          status: result === 'skipped' ? 'skipped' : 'expected',
          results: result ? [{ status: result }] : [],
          annotations: skipReason ? [{ type: 'skip', description: skipReason }] : [],
        },
      ],
    };
  });
  return JSON.stringify({
    config: { rootDir: resolve('test/e2e') },
    suites: [{ specs: [], suites: [{ specs }] }],
    errors: [],
  });
}

function passed(cases: (string | Case)[]) {
  return cases.map(
    (entry) =>
      ({ ...(typeof entry === 'string' ? { file: entry } : entry), result: 'passed' }) as const,
  );
}

const runner = () => vi.fn<(args: string[], discovery: boolean) => string>();

describe('CI browser execution', () => {
  it('discovers the entire suite and runs the core together with exactly the changed spec', () => {
    const required = [...coreCases, changed];
    const run = runner()
      .mockReturnValueOnce(report([...required, other, otherKnn]))
      .mockReturnValueOnce(report(passed(required)));
    runBrowserChecks(selected, run);

    expect(run.mock.calls[0]).toEqual([list, true]);
    const [args, discovery] = run.mock.calls[1];
    expect(discovery).toBe(false);
    expect(args.slice(0, execute.length)).toEqual(execute);
    const paths = args.slice(execute.length, -2);
    const patterns = paths.map((pattern) => new RegExp(pattern));
    expect(patterns).toHaveLength(core.length + 1);
    for (const file of [...core, changed]) {
      expect(patterns.some((pattern) => pattern.test(`/checkout/${file}`))).toBe(true);
    }
    expect(patterns.some((pattern) => pattern.test(`/checkout/${other}`))).toBe(false);
    expect(args.slice(-2)).toEqual(
      [everyday, neighbors].map(({ file, line }) => `^${RegExp.escape(resolve(file))}$:${line}:1`),
    );
  });

  it('runs all cases in a changed quiz file without selecting its tagged case twice', () => {
    const required = [...coreCases, otherKnn];
    const run = runner()
      .mockReturnValueOnce(report([...required, other]))
      .mockReturnValueOnce(report(passed(required)));
    runBrowserChecks({ ...selected, spec: neighbors.file }, run);
    expect(run.mock.calls[1][0].slice(execute.length)).toEqual([
      ...[...core, neighbors.file].map((file) => `(^|/)${RegExp.escape(file)}$`),
      `^${RegExp.escape(resolve(everyday.file))}$:${everyday.line}:1`,
    ]);
  });

  it.each([
    { cases: [...core, everyday, otherKnn], error: /Missing @ci browser test in .*knn-quiz\.spec/ },
    { cases: [...coreCases, { ...otherKnn, tagged: true }], error: /Unexpected @ci browser test/ },
    { cases: [...coreCases, { file: other, tagged: true }], error: /Unexpected @ci browser test/ },
  ])('rejects incomplete or expanded quiz labels before execution', ({ cases, error }) => {
    const run = runner().mockReturnValueOnce(report(cases));
    expect(() => runBrowserChecks(selected, run)).toThrow(error);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it.each([full, selected])('rejects a missing core file in the $reason plan', (plan) => {
    const files = [...coreCases, changed].filter((entry) => entry !== requiredConsent);
    const run = runner().mockReturnValueOnce(report(files));
    expect(() => runBrowserChecks(plan, run)).toThrow(
      /No runnable browser tests in .*training-bfcache\.spec/,
    );
    expect(run).toHaveBeenCalledTimes(1);
  });

  it.each(['skipped', 'failed'] as const)(
    'rejects a required case marked as %s even when its file has another case',
    (expectedStatus) => {
      const run = runner().mockReturnValueOnce(
        report([...coreCases, changed, { file: changed, title: 'required case', expectedStatus }]),
      );
      expect(() => runBrowserChecks(selected, run)).toThrow(
        'Required browser test disabled: required case.',
      );
      expect(run).toHaveBeenCalledTimes(1);
    },
  );

  it('propagates a failing Playwright execution to its job', () => {
    const run = runner()
      .mockReturnValueOnce(report([...coreCases, changed]))
      .mockImplementationOnce(() => {
        throw new Error('A selected test failed.');
      });
    expect(() => runBrowserChecks(selected, run)).toThrow('A selected test failed.');
  });

  it('executes the full local suite without file filters or a shard', () => {
    const files = [...coreCases, changed, other];
    const run = runner()
      .mockReturnValueOnce(report(files))
      .mockReturnValueOnce(report(passed(files)));
    runBrowserChecks(full, run);
    expect(run.mock.calls).toEqual([
      [list, true],
      [execute, false],
    ]);
  });

  it('requires evidence for the same test identity even when the test count matches', () => {
    const run = runner()
      .mockReturnValueOnce(report(coreCases))
      .mockReturnValueOnce(
        report([
          ...passed(coreCases.filter((entry) => entry !== core[1])),
          { file: core[1], title: 'different test', result: 'passed' },
        ]),
      );
    expect(() => runBrowserChecks(full, run)).toThrow('Missing browser result: site.spec.ts.');
  });

  it('rejects a core quiz skipped during execution even with a documented reason', () => {
    const run = runner()
      .mockReturnValueOnce(report(coreCases))
      .mockReturnValueOnce(
        report([
          ...passed([...core, everyday]),
          {
            ...neighbors,
            result: 'skipped',
            skipReason: 'Browser capability unavailable',
          },
        ]),
      );
    expect(() => runBrowserChecks(full, run)).toThrow('Browser test did not pass: KNN quiz.');
  });

  it('permits only documented skips outside the required specs', () => {
    const files = [...coreCases, other];
    const skip = { file: other, result: 'skipped' } as const;
    const run = runner()
      .mockReturnValueOnce(report(files))
      .mockReturnValueOnce(
        report([...passed(coreCases), { ...skip, skipReason: 'Optional capability unavailable' }]),
      )
      .mockReturnValueOnce(report(files))
      .mockReturnValueOnce(report([...passed(coreCases), skip]));
    expect(() => runBrowserChecks(full, run)).not.toThrow();
    expect(() => runBrowserChecks(full, run)).toThrow(
      'Browser test did not pass: error-recovery-navigation.spec.ts.',
    );
  });

  it.each([0, 1])('validates only native discovery results for shard slot %s', (index) => {
    const shardFiles = [
      core[index],
      index === 0 ? everyday : neighbors,
      index === 0 ? changed : other,
    ];
    const shard = `--shard=${index + 1}/2`;
    const run = runner()
      .mockReturnValueOnce(report([...coreCases, changed, other, otherKnn]))
      .mockReturnValueOnce(report(shardFiles))
      .mockReturnValueOnce(report(passed(shardFiles)));
    runBrowserChecks(full, run, { index, total: 2 });

    expect(run.mock.calls).toEqual([
      [list, true],
      [[...list, shard], true],
      [[...execute, shard], false],
    ]);
  });

  it('requires the GitHub job count and zero-based slot to match the plan', () => {
    expect(readBrowserSlot(full, { CI_BROWSER_SLOT: '1', CI_BROWSER_SLOTS: '2' })).toEqual({
      index: 1,
      total: 2,
    });
    expect(readBrowserSlot(selected, { CI_BROWSER_SLOT: '0', CI_BROWSER_SLOTS: '1' })).toEqual({
      index: 0,
      total: 1,
    });
    for (const [plan, environment] of [
      [full, {}],
      [full, { CI_BROWSER_SLOT: '2', CI_BROWSER_SLOTS: '2' }],
      [full, { CI_BROWSER_SLOT: '0', CI_BROWSER_SLOTS: '1' }],
      [selected, { CI_BROWSER_SLOT: '1', CI_BROWSER_SLOTS: '1' }],
      [selected, { CI_BROWSER_SLOT: '0', CI_BROWSER_SLOTS: '2' }],
    ] as const) {
      expect(() => readBrowserSlot(plan, environment)).toThrow('Invalid browser job slot');
    }
  });
});
