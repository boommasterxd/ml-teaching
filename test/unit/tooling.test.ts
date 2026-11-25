import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempDisposableSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ciPlanVersion, createPlan, selectWork } from '../../.github/scripts/plan-ci.ts';
import { validatePlan, validateResults } from '../../.github/scripts/validate-ci.ts';

const revisions = { base: 'a'.repeat(40), head: 'b'.repeat(40), merge: 'c'.repeat(40) };
const planner = resolve('.github/scripts/plan-ci.ts');
const validator = resolve('.github/scripts/validate-ci.ts');
const gitEnv = {
  PATH: process.env.PATH,
  NODE_ENV: 'test' as const,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_AUTHOR_NAME: 'CI Fixture',
  GIT_AUTHOR_EMAIL: 'ci@example.invalid',
  GIT_COMMITTER_NAME: 'CI Fixture',
  GIT_COMMITTER_EMAIL: 'ci@example.invalid',
};

function createGitFixture(cwd: string) {
  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd, env: gitEnv, encoding: 'utf8', timeout: 5_000 }).trim();
  git('init', '-q', '--template=', '--initial-branch=main');
  return git;
}

function createMergeFixture(cwd: string) {
  const git = createGitFixture(cwd);
  mkdirSync(join(cwd, 'docs'));
  writeFileSync(join(cwd, 'docs', 'guide.md'), 'Guide\n');
  git('add', 'docs');
  git('commit', '-qm', 'Initial documentation');
  git('switch', '-qc', 'feature');
  git('mv', 'docs/guide.md', 'guide.md');
  git('commit', '-qm', 'Move guide to repository root');
  mkdirSync(join(cwd, 'docs'), { recursive: true });
  writeFileSync(join(cwd, 'docs', 'notes.md'), 'Feature notes\n');
  git('add', 'docs');
  git('commit', '-qm', 'Add feature note');
  const head = git('rev-parse', 'HEAD');
  git('switch', '-q', 'main');
  writeFileSync(join(cwd, 'docs', 'contributing.md'), 'Contributing\n');
  git('add', 'docs');
  git('commit', '-qm', 'Update base branch');
  const base = git('rev-parse', 'HEAD');
  git('merge', '-q', '--no-ff', 'feature', '-m', 'Simulated pull request merge');
  return { base, head, merge: git('rev-parse', 'HEAD') };
}

const browserSpec = 'test/e2e/quiz.spec.ts';

function planBrowserFixture(cwd: string, change: string) {
  const git = createGitFixture(cwd);
  mkdirSync(join(cwd, 'test/e2e'), { recursive: true });
  writeFileSync(join(cwd, browserSpec), 'Original spec\n');
  git('add', '.');
  git('commit', '-qm', 'Add browser spec');
  git('switch', '-qc', 'feature');
  if (change === 'deleted') git('rm', '-q', browserSpec);
  else writeFileSync(join(cwd, browserSpec), 'Changed spec\n');
  if (change === 'fixture')
    writeFileSync(join(cwd, 'test/e2e/browser-checks.ts'), 'Shared fixture\n');
  git('add', '.');
  git('commit', '-qm', 'Update browser test');
  const head = git('rev-parse', 'HEAD');
  git('switch', '-q', 'main');
  if (change === 'base') {
    writeFileSync(join(cwd, 'package.json'), '{}\n');
    git('add', 'package.json');
    git('commit', '-qm', 'Change the base');
  }
  const base = git('rev-parse', 'HEAD');
  git('merge', '-q', '--no-ff', '--no-commit', 'feature');
  if (change === 'merge-tree') {
    writeFileSync(join(cwd, 'test/e2e/browser-checks.ts'), 'Unexpected merge content\n');
    git('add', 'test/e2e/browser-checks.ts');
  }
  git('commit', '-qm', 'Simulated pull request merge');
  const merge = git('rev-parse', 'HEAD');
  return createPlan({ base, head, merge }, (args) => git(...args));
}

describe('CI selection and required gate', () => {
  it('skips costly work only for a complete nonempty documentation diff', () => {
    expect(selectWork(['docs/architecture.md', 'docs/decisions/example.md'])).toEqual({
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

  it('runs all checks when the diff changes non-Markdown documentation or its filter', () => {
    expect(selectWork(['docs/guide.ts']).reason).toBe('full');
    expect(selectWork(['docs/guide.md', 'docs/data.json']).reason).toBe('full');
    expect(selectWork(['scripts/docs-path.ts']).reason).toBe('full');
  });

  it('selects all work for missing history and rejects incomplete revisions', () => {
    expect(
      createPlan(revisions, () => {
        throw new Error('Missing history');
      }).reason,
    ).toBe('full');
    expect(() => createPlan({ ...revisions, head: 'truncated' })).toThrow();
  });

  it('keeps quality and unit checks for local Lighthouse tooling and checks browsers for mixed changes', () => {
    const tooling = ['scripts/check-lighthouse.ts', 'scripts/lighthouse-runtime.ts'];
    const work = selectWork([...tooling, 'test/unit/scripts/check-lighthouse.test.ts']);
    expect(work).toEqual({ quality: true, browser: false, reason: 'local-tooling' });
    expect(selectWork([...tooling, 'src/app/page.tsx']).reason).toBe('full');
    expect(selectWork([...tooling, 'scripts/ignore-build.ts']).reason).toBe('full');

    const plan = { version: ciPlanVersion, ...revisions, ...work };
    const results = { plan: 'success', quality: 'success', browser: 'skipped' };
    expect(() => validateResults(plan, revisions, results)).not.toThrow();
    expect(() => validateResults(plan, revisions, { ...results, quality: 'skipped' })).toThrow();
  });

  it('selects one isolated spec on an up-to-date simulated merge and requires its browser job', () => {
    using directory = mkdtempDisposableSync(join(tmpdir(), 'ml-teaching-browser-plan-'));
    const plan = planBrowserFixture(directory.path, 'single');
    expect(plan).toMatchObject({
      quality: true,
      browser: true,
      reason: 'browser-spec',
      spec: browserSpec,
    });
    const outcomes = { plan: 'success', quality: 'success', browser: 'success' };
    expect(() => validateResults(plan, plan, outcomes)).not.toThrow();
    for (const browser of ['failure', 'cancelled', 'skipped']) {
      expect(() => validateResults(plan, plan, { ...outcomes, browser })).toThrow();
    }
    expect(() => validatePlan({ ...plan, spec: 'test/e2e/*.spec.ts' }, plan)).toThrow();
    expect(() => validatePlan({ ...plan, spec: undefined }, plan)).toThrow();
    expect(() => validatePlan({ ...plan, reason: 'full' }, plan)).toThrow();
  });

  it.each(['deleted', 'fixture', 'base', 'merge-tree'])(
    'selects the full browser suite for a %s change',
    (change) => {
      using directory = mkdtempDisposableSync(join(tmpdir(), 'ml-teaching-browser-plan-'));
      expect(planBrowserFixture(directory.path, change)).toMatchObject({
        quality: true,
        browser: true,
        reason: 'full',
      });
    },
  );

  it('selects browser checks for an earlier rename out of docs and fails if CI skips them', () => {
    using directory = mkdtempDisposableSync(join(tmpdir(), 'ml-teaching-ci-'));
    const cwd = directory.path;
    const { base, head, merge } = createMergeFixture(cwd);
    const output = join(cwd, 'github-output');
    const env = {
      ...gitEnv,
      CHANGE_BASE_SHA: base,
      CHANGE_HEAD_SHA: head,
      CHANGE_MERGE_SHA: merge,
    };
    const options = { cwd, encoding: 'utf8' as const, timeout: 5_000 };
    execFileSync(process.execPath, [planner], {
      ...options,
      env: { ...env, GITHUB_OUTPUT: output },
    });
    const plan = readFileSync(output, 'utf8').match(/^plan=(.+)$/m)?.[1];
    if (!plan) throw new Error('The CI planner did not publish a plan.');
    expect(JSON.parse(plan)).toMatchObject({ base, head, merge, quality: true, browser: true });
    const validate = (browser?: string) =>
      spawnSync(process.execPath, [validator, '--results'], {
        ...options,
        env: {
          ...env,
          CI_PLAN: plan,
          CI_RESULTS: browser
            ? JSON.stringify({ plan: 'success', quality: 'success', browser })
            : undefined,
        },
      });
    expect(validate('success').status).toBe(0);
    const skipped = validate('skipped');
    expect(skipped.status).toBe(1);
    expect(skipped.stderr).toContain('Unexpected browser result: skipped');
    expect(validate().stderr).toContain('The final CI gate requires job results.');
  });

  it('rejects failed planning, selected failures, unexpected skips and stale plans', () => {
    const plan = { version: ciPlanVersion, ...revisions, ...selectWork(['src/app/page.tsx']) };
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
    const docsPlan = {
      version: ciPlanVersion,
      ...revisions,
      ...selectWork(['docs/architecture.md']),
    };
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
