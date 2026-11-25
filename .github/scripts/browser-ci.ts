import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmdirSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { JSONReport, JSONReportSuite, JSONReportTest } from '@playwright/test/reporter';
import type { CiPlan } from './plan-ci.ts';
import { checkoutPlanInput, validatePlan } from './validate-ci.ts';

const coreSpecs = ['test/e2e/security-headers.spec.ts', 'test/e2e/site.spec.ts'];

interface BrowserSlot {
  index: number;
  total: 1 | 2;
}

type BrowserCase = JSONReportTest & { file: string; title: string };
type BrowserCases = Map<string, BrowserCase>;

export function readBrowserSlot(
  plan: CiPlan,
  environment: Readonly<Record<string, string | undefined>> = process.env,
): BrowserSlot {
  const total = plan.reason === 'full' ? 2 : 1;
  const { CI_BROWSER_SLOT: index, CI_BROWSER_SLOTS: count } = environment;
  if (count !== String(total) || (index !== '0' && !(total === 2 && index === '1'))) {
    throw new Error('Invalid browser job slot for the CI plan.');
  }
  return { index: Number(index), total };
}

function collectCases(suites: JSONReportSuite[], root: string, cases: BrowserCases) {
  for (const suite of suites) {
    for (const spec of suite.specs) {
      const file = resolve(root, spec.file);
      for (const test of spec.tests) {
        const key = JSON.stringify([file, spec.id, test.projectId]);
        if (cases.has(key)) throw new Error(`Duplicate browser test: ${spec.title}.`);
        cases.set(key, { ...test, file, title: spec.title });
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

function requireRunnableFiles(all: BrowserCases, requiredFiles: Set<string>) {
  const found = new Set<string>();
  for (const { file, title, expectedStatus } of all.values()) {
    if (!requiredFiles.has(file)) continue;
    if (expectedStatus !== 'passed') throw new Error(`Required browser test disabled: ${title}.`);
    found.add(file);
  }
  const missing = [...requiredFiles].filter((file) => !found.has(file));
  if (missing.length) throw new Error(`No runnable browser tests in ${missing.join(', ')}.`);
}

function checkExecution(expected: BrowserCases, actual: BrowserCases, requiredFiles: Set<string>) {
  if (actual.size !== expected.size) throw new Error('Browser execution did not match discovery.');
  for (const [key, { file, title }] of expected) {
    const test = actual.get(key);
    if (!test) throw new Error(`Missing browser result: ${title}.`);
    if (
      test.status === 'expected' &&
      test.results.length === 1 &&
      test.results[0].status === 'passed'
    )
      continue;
    if (!requiredFiles.has(file) && isDocumentedSkip(test)) continue;
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

export function runBrowserChecks(plan: CiPlan, run = runPlaywright, slot?: BrowserSlot) {
  if (!plan.browser) throw new Error('Browser checks are required to run this job.');
  const selected = plan.reason === 'browser-spec' ? [...new Set([...coreSpecs, plan.spec])] : [];
  const requiredFiles = new Set(
    (selected.length ? selected : coreSpecs).map((file) => resolve(file)),
  );
  const discover = (filters: string[] = []) =>
    readCases(run(['--list', '--reporter=json', '--forbid-only', ...filters], true));
  // Discover without file filters so Playwright can reject imports between specs.
  const all = discover();
  requireRunnableFiles(all, requiredFiles);

  const shard = slot?.total === 2 ? [`--shard=${slot.index + 1}/${slot.total}`] : [];
  const selection = selected.map((file) => `(^|/)${RegExp.escape(file)}$`);
  const expected =
    shard.length > 0
      ? discover(shard)
      : selected.length
        ? new Map([...all].filter(([, test]) => requiredFiles.has(test.file)))
        : all;
  if ([...expected.keys()].some((key) => !all.has(key))) {
    throw new Error('Browser shard discovery did not match the full suite.');
  }

  const args = ['--workers=2', '--forbid-only', '--reporter=line,json', ...shard, ...selection];
  checkExecution(expected, readCases(run(args, false)), requiredFiles);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { plan, expected } = checkoutPlanInput();
  const validatedPlan = validatePlan(plan, expected);
  runBrowserChecks(validatedPlan, undefined, readBrowserSlot(validatedPlan));
}
