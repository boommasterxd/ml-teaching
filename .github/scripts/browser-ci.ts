import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmdirSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { JSONReport, JSONReportSuite, JSONReportTest } from '@playwright/test/reporter';
import type { CiPlan } from './plan-ci.ts';
import { checkoutPlanInput, validatePlan } from './validate-ci.ts';

const coreSpecs = [
  'test/e2e/security-headers.spec.ts',
  'test/e2e/site.spec.ts',
  'test/e2e/initial-content.spec.ts',
  'test/e2e/intent-navigation.spec.ts',
  'test/e2e/training-bfcache.spec.ts',
];
const coreQuizSpecs = ['test/e2e/quiz.spec.ts', 'test/e2e/knn-quiz.spec.ts'];

type BrowserCase = JSONReportTest & {
  file: string;
  title: string;
  tags: string[];
  line: number;
  column: number;
};
type BrowserCases = Map<string, BrowserCase>;

function collectCases(suites: JSONReportSuite[], root: string, cases: BrowserCases) {
  for (const suite of suites) {
    for (const spec of suite.specs) {
      const file = resolve(root, spec.file);
      for (const test of spec.tests) {
        const key = JSON.stringify([file, spec.id, test.projectId]);
        if (cases.has(key)) throw new Error(`Duplicate browser test: ${spec.title}.`);
        const { title, tags, line, column } = spec;
        cases.set(key, { ...test, file, title, tags, line, column });
      }
    }
    collectCases(suite.suites ?? [], root, cases);
  }
}

function readCases(output: string) {
  const report = JSON.parse(output) as JSONReport;
  if (report.errors.length) throw new Error('Playwright reported browser runner errors.');
  const cases: BrowserCases = new Map();
  collectCases(report.suites, report.config.rootDir, cases);
  if (cases.size === 0) throw new Error('No browser tests reported.');
  return cases;
}

function requireQuizCases(all: BrowserCases) {
  const missing = new Set(coreQuizSpecs.map((file) => resolve(file)));
  const quizzes: BrowserCases = new Map();
  for (const [key, test] of all) {
    if (!test.tags.includes('ci')) continue;
    if (!missing.delete(test.file)) throw new Error(`Unexpected @ci browser test: ${test.title}.`);
    if (![test.line, test.column].every((part) => Number.isSafeInteger(part) && part > 0)) {
      throw new Error(`Missing Playwright location for @ci browser test: ${test.title}.`);
    }
    quizzes.set(key, test);
  }
  if (missing.size) throw new Error(`Missing @ci browser test in ${[...missing].join(', ')}.`);
  return quizzes;
}

function requireRunnableCases(
  all: BrowserCases,
  requiredFiles: Set<string>,
  quizzes: BrowserCases,
) {
  const found = new Set<string>();
  const required: BrowserCases = new Map();
  for (const [key, test] of all) {
    const { file, title, expectedStatus } = test;
    if (!requiredFiles.has(file) && !quizzes.has(key)) continue;
    if (expectedStatus !== 'passed') throw new Error(`Required browser test disabled: ${title}.`);
    found.add(file);
    required.set(key, test);
  }
  const missing = [...requiredFiles].filter((file) => !found.has(file));
  if (missing.length) throw new Error(`No runnable browser tests in ${missing.join(', ')}.`);
  return required;
}

function checkExecution(expected: BrowserCases, actual: BrowserCases, required: BrowserCases) {
  if (actual.size !== expected.size) throw new Error('Browser execution did not match discovery.');
  for (const [key, { title }] of expected) {
    const test = actual.get(key);
    if (!test) throw new Error(`Missing browser result: ${title}.`);
    if (
      test.status === 'expected' &&
      test.results.length === 1 &&
      test.results[0].status === 'passed'
    )
      continue;
    if (!required.has(key) && isDocumentedSkip(test)) continue;
    throw new Error(`Browser test did not pass: ${title}.`);
  }
}

function isDocumentedSkip(test: BrowserCase) {
  return (
    test.status === 'skipped' &&
    test.results.length === 1 &&
    test.results[0].status === 'skipped' &&
    test.annotations.some(
      ({ type, description }) => ['skip', 'fixme'].includes(type) && Boolean(description?.trim()),
    )
  );
}

function runPlaywright(args: string[], discovery: boolean) {
  const directory = mkdtempSync(join(tmpdir(), 'ml-teaching-browser-ci-'));
  const report = join(directory, 'report.json');
  try {
    execFileSync('npm', ['run', '--silent', 'test:e2e', '--', ...args], {
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_FILE: report },
      stdio: 'inherit',
      timeout: discovery ? 30_000 : undefined,
    });
    return readFileSync(report, 'utf8');
  } finally {
    if (existsSync(report)) unlinkSync(report);
    rmdirSync(directory);
  }
}

export function runBrowserChecks(plan: CiPlan, run = runPlaywright) {
  if (!plan.browser) throw new Error('Browser checks are required to run this job.');
  const selected = plan.reason === 'browser-spec' ? [...new Set([...coreSpecs, plan.spec])] : [];
  const requiredFiles = new Set(
    (selected.length ? selected : coreSpecs).map((file) => resolve(file)),
  );
  // Discover without file filters so Playwright can reject imports between specs.
  const all = readCases(run(['--list', '--reporter=json', '--forbid-only'], true));
  const quizzes = requireQuizCases(all);
  const required = requireRunnableCases(all, requiredFiles, quizzes);

  const selection = selected.map((file) => `(^|/)${RegExp.escape(file)}$`);
  if (selected.length) {
    for (const { file, line, column } of quizzes.values()) {
      if (!requiredFiles.has(file)) selection.push(`^${RegExp.escape(file)}$:${line}:${column}`);
    }
  }
  const workers = selected.length ? 2 : 4;
  const args = [`--workers=${workers}`, '--forbid-only', '--reporter=line,json', ...selection];
  checkExecution(selected.length ? required : all, readCases(run(args, false)), required);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { plan, expected } = checkoutPlanInput();
  const validatedPlan = validatePlan(plan, expected);
  runBrowserChecks(validatedPlan);
}
