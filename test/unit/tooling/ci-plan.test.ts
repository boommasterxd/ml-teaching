import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempDisposableSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { createPlan, testGroups } from '../../../.github/scripts/plan-ci';
import { validateResults } from '../../../.github/scripts/validate-ci';

const base = '1'.repeat(40);
const head = '2'.repeat(40);
const merge = '3'.repeat(40);
const tree = '4'.repeat(40);
const revisions = { base, head, merge };

function planFor(paths: string[], mergeTree = tree) {
  return createPlan(revisions, ([command]) => {
    switch (command) {
      case 'merge-base':
        return base;
      case 'diff':
        return paths.map((path) => `:100644 100644 ${base} ${head} M\0${path}\0`).join('');
      case 'rev-list':
        return `${merge} ${base} ${head}`;
      case 'rev-parse':
        return `${tree}\n${mergeTree}`;
      default:
        throw new Error('Unexpected Git request.');
    }
  });
}

it('skips substantive checks only for docs and skips tests only for proven no-impact changes', () => {
  const docs = planFor(['docs/guide.md']);
  expect(docs).toMatchObject({ reason: 'docs', tests: [] });
  expect(() =>
    validateResults(docs, revisions, { plan: 'success', quality: 'skipped' }),
  ).not.toThrow();

  const tooling = planFor(['docs/guide.md', 'scripts/check-lighthouse.ts']);
  expect(tooling).toMatchObject({ reason: 'no-impact', tests: [] });
  expect(() =>
    validateResults(tooling, revisions, { plan: 'success', quality: 'success' }),
  ).not.toThrow();
  expect(() =>
    validateResults(tooling, revisions, { plan: 'success', quality: 'skipped' }),
  ).toThrow();
});

it('selects each affected group once and falls back when the merge tree or impact is uncertain', () => {
  const paths = [
    'docs/guide.md',
    'src/lib/knn.ts',
    'test/unit/learning/quiz.test.ts',
    'test/e2e/delivery.spec.ts',
  ];
  expect(planFor(paths)).toMatchObject({ reason: 'affected', tests: ['learning', 'delivery'] });

  for (const plan of [
    planFor(paths, base),
    planFor([...paths, 'test/e2e/synthetic-model.ts']),
    planFor(['package-lock.json']),
    planFor([]),
    createPlan(revisions, () => {
      throw new Error('History unavailable.');
    }),
  ]) {
    expect(plan).toMatchObject({ reason: 'full', tests: [...testGroups] });
  }
});

it('includes paths renamed out of docs in an earlier PR commit', () => {
  using directory = mkdtempDisposableSync(join(tmpdir(), 'ml-teaching-ci-plan-'));
  const git = (args: string[]) =>
    execFileSync(
      'git',
      [
        '-c',
        'user.name=CI fixture',
        '-c',
        'user.email=fixture@example.invalid',
        '-c',
        'commit.gpgsign=false',
        ...args,
      ],
      { cwd: directory.path, encoding: 'utf8' },
    ).trimEnd();
  git(['init', '-q', '--template=', '--initial-branch=main']);
  mkdirSync(join(directory.path, 'docs'));
  writeFileSync(join(directory.path, 'docs/guide.md'), 'Initial guide.');
  git(['add', '.']);
  git(['commit', '-qm', 'Add guide']);
  const base = git(['rev-parse', 'HEAD']);
  git(['switch', '-qc', 'feature']);
  git(['mv', 'docs/guide.md', 'guide.md']);
  git(['commit', '-qm', 'Rename guide']);
  mkdirSync(join(directory.path, 'docs'), { recursive: true });
  writeFileSync(join(directory.path, 'docs/new.md'), 'New guide.');
  git(['add', '.']);
  git(['commit', '-qm', 'Add documentation']);
  const head = git(['rev-parse', 'HEAD']);
  git(['switch', '-q', 'main']);
  git(['merge', '-q', '--no-ff', 'feature', '-m', 'Simulated PR merge']);
  const merge = git(['rev-parse', 'HEAD']);
  expect(createPlan({ base, head, merge }, git)).toMatchObject({
    reason: 'full',
    tests: [...testGroups],
  });
});

it('rejects stale or malformed plans and fails closed on missing or failed job results', () => {
  const plan = planFor(['test/e2e/delivery.spec.ts']);
  expect(() =>
    validateResults(plan, revisions, { plan: 'success', quality: 'success' }),
  ).not.toThrow();
  for (const tests of [[], ['unknown'], ['delivery', 'delivery'], null]) {
    expect(() =>
      validateResults({ ...plan, tests }, revisions, { plan: 'success', quality: 'success' }),
    ).toThrow();
  }
  expect(() =>
    validateResults({ ...plan, base: head }, revisions, { plan: 'success', quality: 'success' }),
  ).toThrow();
  for (const quality of ['skipped', 'failure', 'cancelled', undefined]) {
    expect(() => validateResults(plan, revisions, { plan: 'success', quality })).toThrow();
  }
  expect(() => validateResults(plan, revisions, { plan: 'failure', quality: 'success' })).toThrow();
});
