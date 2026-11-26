import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmdirSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import type { JSONReport, JSONReportSuite } from '@playwright/test/reporter';
import { browserSpecs, unitGroups, type CiPlan } from './plan-ci.ts';
import { checkoutPlanInput, validatePlan } from './validate-ci.ts';

interface UnitReport {
  success: boolean;
  testResults: {
    name: string;
    assertionResults: { status: string }[];
  }[];
}

function runTests<T>(script: 'test' | 'test:e2e', args: string[]): T {
  const directory = mkdtempSync(join(tmpdir(), 'ml-teaching-core-tests-'));
  const report = join(directory, 'report.json');
  try {
    const output = script === 'test' ? [`--outputFile.json=${report}`] : [];
    execFileSync('npm', ['run', '--silent', script, '--', ...args, ...output], {
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_FILE: report },
      stdio: 'inherit',
    });
    return JSON.parse(readFileSync(report, 'utf8')) as T;
  } finally {
    if (existsSync(report)) unlinkSync(report);
    rmdirSync(directory);
  }
}

function verifyUnitTests(selected: (typeof unitGroups)[number][]) {
  if (!selected.length) return;
  const filters =
    selected.length === unitGroups.length ? [] : selected.flatMap((group) => ['--project', group]);
  const report = runTests<UnitReport>('test', [
    ...filters,
    '--allowOnly=false',
    '--reporter=default',
    '--reporter=json',
  ]);
  if (!report.success) throw new Error('Vitest did not report success.');
  const missing = new Set<string>(selected);
  for (const { name, assertionResults } of report.testResults) {
    const group = selected.find((candidate) =>
      name.startsWith(resolve('test/unit', candidate) + sep),
    );
    if (
      !group ||
      !assertionResults.length ||
      assertionResults.some(({ status }) => status !== 'passed')
    ) {
      throw new Error(`Unexpected or unsuccessful unit test file: ${name}`);
    }
    missing.delete(group);
  }
  if (missing.size) throw new Error(`No runnable unit tests for: ${[...missing].join(', ')}`);
}

function collectBrowserFiles(suites: JSONReportSuite[], root: string, files: Set<string>) {
  for (const suite of suites) {
    for (const spec of suite.specs) {
      if (!spec.tests.length) throw new Error(`No browser test for: ${spec.title}`);
      for (const test of spec.tests) {
        if (
          test.expectedStatus !== 'passed' ||
          test.status !== 'expected' ||
          test.results.length !== 1 ||
          test.results[0].status !== 'passed'
        ) {
          throw new Error(`Browser test did not pass: ${spec.title}`);
        }
        files.add(resolve(root, spec.file));
      }
    }
    collectBrowserFiles(suite.suites ?? [], root, files);
  }
}

function verifyBrowserTests(tests: CiPlan['tests']) {
  const entries = Object.entries(browserSpecs) as [keyof typeof browserSpecs, string][];
  const selected = entries.filter(([group]) => tests.includes(group)).map(([, spec]) => spec);
  if (!selected.length) return;
  const filters =
    selected.length === entries.length
      ? []
      : selected.map((spec) => `(^|/)${RegExp.escape(spec)}$`);
  const report = runTests<JSONReport>('test:e2e', [
    ...filters,
    '--forbid-only',
    '--reporter=line,json',
  ]);
  if (report.errors.length) throw new Error('Playwright reported runner errors.');
  const files = new Set<string>();
  collectBrowserFiles(report.suites, report.config.rootDir, files);
  if (files.size !== selected.length || selected.some((spec) => !files.has(resolve(spec)))) {
    throw new Error('Browser test execution did not match the selected specs.');
  }
}

const { plan, expected } = checkoutPlanInput();
const { tests } = validatePlan(plan, expected);
if (tests.length) console.log(`Core test groups: ${tests.join(', ')}`);
else console.log('The verified diff has no affected core tests.');
verifyUnitTests(unitGroups.filter((group) => tests.includes(group)));
verifyBrowserTests(tests);
