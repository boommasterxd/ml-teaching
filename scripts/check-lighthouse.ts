import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { setTimeout as wait } from 'node:timers/promises';
import { promisify } from 'node:util';
import type { Result } from 'lighthouse/types/lh.js';
import { chromium, type Browser } from '@playwright/test';
import config from '../csp.config.mjs';
import { resolveLighthouse } from './lighthouse-runtime.ts';

const execute = promisify(execFile);
const origin = 'http://127.0.0.1:3100';
const reportDirectory = resolve('test-results/lighthouse');
const performanceThreshold = 0.95;
const profiles = ['mobile', 'desktop'] as const;
type Profile = (typeof profiles)[number];
type LighthouseRuntime = Awaited<ReturnType<typeof resolveLighthouse>>;

async function readActivePort(path: string) {
  // The browser CDP session can open before Chromium publishes its TCP endpoint.
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const data = await readFile(path, 'utf8');
      if (data.trim()) return data;
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
    }
    await wait(25);
  }
  throw new Error('The owned Chromium did not publish its CDP port.');
}

/** Chromium records its ephemeral CDP port inside this task's own profile. */
async function debuggingPort(browser: Browser) {
  const session = await browser.newBrowserCDPSession();
  try {
    const command = await session.send('Browser.getBrowserCommandLine');
    const profile = command.arguments.find((argument) => argument.startsWith('--user-data-dir='));
    if (!profile) throw new Error('The owned Chromium profile could not be identified.');
    const activePort = await readActivePort(
      resolve(profile.slice('--user-data-dir='.length), 'DevToolsActivePort'),
    );
    const port = Number(activePort.split('\n')[0]);
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      throw new Error('The owned Chromium did not expose a valid CDP port.');
    return port;
  } finally {
    await session.detach();
  }
}

function auditTargets(all: boolean) {
  if (!all) return [{ path: '/', status: 200 }];
  return [
    ...config.routes.map((path) => ({ path, status: 200 })),
    ...config.errorRoutes.map((path) => ({ path, status: Number(path.slice(1)) })),
  ];
}

/** Validate the actual status before letting Lighthouse audit an error document. */
async function verifyDocument(url: URL, status: number) {
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(10_000) });
  await response.body?.cancel();
  if (
    response.status !== status ||
    !response.headers.get('content-type')?.startsWith('text/html')
  ) {
    throw new Error(
      `Expected HTTP ${status} HTML at ${url.href}, received HTTP ${response.status}.`,
    );
  }
}

function verifyReport(report: Result, url: URL, profile: Profile, version: string) {
  const label = `${url.pathname} ${profile}`;
  if (report.runtimeError) throw new Error(`${label}: ${report.runtimeError.message}`);
  if (
    report.requestedUrl !== url.href ||
    report.mainDocumentUrl !== url.href ||
    report.finalDisplayedUrl !== url.href ||
    report.configSettings.formFactor !== profile ||
    report.lighthouseVersion !== version
  ) {
    throw new Error(`${label}: Lighthouse returned a different URL, device profile or version.`);
  }
}

async function audit(
  { path, status }: ReturnType<typeof auditTargets>[number],
  { all, runtime, port }: { all: boolean; runtime: LighthouseRuntime; port: number },
) {
  const url = new URL(path, origin);
  await verifyDocument(url, status);
  const directory = all
    ? resolve(reportDirectory, 'routes', path.slice(1) || '_home')
    : reportDirectory;
  await mkdir(directory, { recursive: true });
  const categories = all
    ? ['performance']
    : ['performance', 'accessibility', 'best-practices', 'seo'];
  for (const profile of profiles) {
    const { stdout } = await execute(
      process.execPath,
      [
        runtime.cli,
        url.href,
        `--port=${port}`,
        '--output=json',
        '--output-path=stdout',
        '--no-enable-error-reporting',
        `--only-categories=${categories.join(',')}`,
        ...(profile === 'desktop' ? ['--preset=desktop'] : []),
        ...(status === 200 ? [] : ['--ignore-status-code']),
      ],
      { timeout: 120_000, maxBuffer: 24 * 1024 * 1024 },
    );
    const report = JSON.parse(stdout) as Result;
    verifyReport(report, url, profile, runtime.version);
    await writeFile(resolve(directory, `${profile}.json`), stdout);
    const scores = Object.fromEntries(
      categories.map((category) => [category, report.categories[category]?.score]),
    );
    console.log(path, profile, scores);
    const performance = scores.performance;
    if (Object.values(scores).some((score) => !Number.isFinite(score))) {
      console.error(`${path} ${profile}: Lighthouse did not return all requested scores.`);
      process.exitCode = 1;
    } else if (typeof performance === 'number' && performance <= performanceThreshold) {
      console.error(
        `${path} ${profile}: Performance must exceed ${performanceThreshold * 100} points.`,
      );
      process.exitCode = 1;
    }
  }
}

const argumentsList = process.argv.slice(2);
const flags = new Set(argumentsList);
if (
  flags.size !== argumentsList.length ||
  argumentsList.some((flag) => !['--all', '--locked'].includes(flag))
) {
  throw new Error('Usage: npm run test:lighthouse -- [--all] [--locked]');
}
const all = flags.has('--all');
const runtime = await resolveLighthouse({ lockedFallback: flags.has('--locked') });
console.log('Lighthouse', runtime);
const browser = await chromium.launch({
  headless: true,
  args: ['--enable-automation', '--remote-debugging-port=0'],
});
try {
  const port = await debuggingPort(browser);
  for (const target of auditTargets(all)) {
    await audit(target, { all, runtime, port });
  }
} finally {
  await browser.close();
}
