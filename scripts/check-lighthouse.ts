import { execFile } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
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

async function audit(
  { path, status }: ReturnType<typeof auditTargets>[number],
  { all, cli, port }: { all: boolean; cli: string; port: number },
) {
  const url = new URL(path, origin);
  await verifyDocument(url, status);
  const directory = all
    ? resolve(reportDirectory, 'routes', path.slice(1) || '_home')
    : reportDirectory;
  await mkdir(directory, { recursive: true });
  const categories = all ? 'performance' : 'performance,accessibility,best-practices,seo';
  for (const profile of ['mobile', 'desktop']) {
    const output = resolve(directory, `${profile}.json`);
    await execute(
      process.execPath,
      [
        cli,
        url.href,
        `--port=${port}`,
        '--output=json',
        `--output-path=${output}`,
        `--only-categories=${categories}`,
        ...(profile === 'desktop' ? ['--preset=desktop'] : []),
        ...(status === 200 ? [] : ['--ignore-status-code']),
      ],
      { timeout: 120_000, maxBuffer: 1024 * 1024 },
    );
    const report = JSON.parse(await readFile(output, 'utf8')) as Result;
    if (report.runtimeError) throw new Error(`${path} ${profile}: ${report.runtimeError.message}`);
    const scores = Object.fromEntries(
      Object.entries(report.categories).map(([key, category]) => [key, category.score]),
    );
    console.log(path, profile, scores);
    if (typeof scores.performance !== 'number' || Object.values(scores).includes(null)) {
      process.exitCode = 1;
    }
    if (all && scores.performance !== 1) process.exitCode = 1;
  }
}

const [mode, ...extraArgs] = process.argv.slice(2);
if ((mode !== undefined && mode !== '--all') || extraArgs.length) {
  throw new Error('Usage: npm run test:lighthouse -- [--all]');
}
const all = mode === '--all';
const runtime = await resolveLighthouse();
console.log('Lighthouse', runtime);
const browser = await chromium.launch({
  args: ['--enable-automation', '--remote-debugging-port=0'],
});
try {
  const port = await debuggingPort(browser);
  for (const target of auditTargets(all)) {
    await audit(target, { all, cli: runtime.cli, port });
  }
} finally {
  await browser.close();
}
