import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { CiPlan } from './plan-ci.ts';
import { checkoutPlanInput, validatePlan } from './validate-ci.ts';

const coreSpecs = ['test/e2e/security-headers.spec.ts', 'test/e2e/site.spec.ts'];

interface DiscoverySuite {
  suites?: DiscoverySuite[];
  specs?: { file: string; tests: { expectedStatus: string }[] }[];
}

function collectRunnableFiles(suites: DiscoverySuite[], root: string, files: Set<string>) {
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) {
      if (spec.tests.some(({ expectedStatus }) => ['passed', 'failed'].includes(expectedStatus))) {
        files.add(resolve(root, spec.file));
      }
    }
    collectRunnableFiles(suite.suites ?? [], root, files);
  }
}

function runPlaywright(args: string[], capture = false) {
  return execFileSync('npm', ['run', '--silent', 'test:e2e', '--', ...args], {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    timeout: capture ? 30_000 : undefined,
  });
}

export function runBrowserChecks(plan: CiPlan, run = runPlaywright) {
  if (!plan.browser) throw new Error('Browser checks are required to run this job.');
  const args = ['--workers=3', '--forbid-only'];
  if (plan.reason === 'browser-spec') {
    const selected = [...new Set([...coreSpecs, plan.spec])];
    // Discover without file filters so Playwright can reject imports between specs.
    const discovery = JSON.parse(run(['--list', '--reporter=json', '--forbid-only'], true)) as {
      config: { rootDir: string };
      suites: DiscoverySuite[];
    };
    const files = new Set<string>();
    collectRunnableFiles(discovery.suites, discovery.config.rootDir, files);
    const missing = selected.filter((file) => !files.has(resolve(file)));
    if (missing.length) throw new Error(`No runnable browser tests in ${missing.join(', ')}.`);
    args.push(...selected.map((file) => `(^|/)${RegExp.escape(file)}$`));
  }
  run(args);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { plan, expected } = checkoutPlanInput();
  runBrowserChecks(validatePlan(plan, expected));
}
