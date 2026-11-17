import { execFile } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import type { Result } from 'lighthouse/types/lh.js';
import { chromium, type Browser } from '@playwright/test';
import { resolveLighthouse } from './lighthouse-runtime.ts';

const execute = promisify(execFile);

/** Chromium records its ephemeral CDP port inside this task's own profile. */
async function debuggingPort(browser: Browser) {
  const session = await browser.newBrowserCDPSession();
  try {
    const command = await session.send('Browser.getBrowserCommandLine');
    const profile = command.arguments.find((argument) => argument.startsWith('--user-data-dir='));
    if (!profile) throw new Error('The owned Chromium profile could not be identified.');
    const activePort = await readFile(
      resolve(profile.slice('--user-data-dir='.length), 'DevToolsActivePort'),
      'utf8',
    );
    const port = Number(activePort.split('\n')[0]);
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      throw new Error('The owned Chromium did not expose a valid CDP port.');
    return port;
  } finally {
    await session.detach();
  }
}

const runtime = await resolveLighthouse();
console.log('Lighthouse', runtime);
const browser = await chromium.launch({
  args: ['--enable-automation', '--remote-debugging-port=0'],
});
try {
  const port = await debuggingPort(browser);
  await mkdir('test-results/lighthouse', { recursive: true });
  for (const profile of ['mobile', 'desktop']) {
    const output = resolve(`test-results/lighthouse/${profile}.json`);
    await execute(
      process.execPath,
      [
        runtime.cli,
        'http://127.0.0.1:3100',
        `--port=${port}`,
        '--output=json',
        `--output-path=${output}`,
        '--only-categories=performance,accessibility,best-practices,seo',
        ...(profile === 'desktop' ? ['--preset=desktop'] : []),
      ],
      { timeout: 120_000, maxBuffer: 1024 * 1024 },
    );
    const report = JSON.parse(await readFile(output, 'utf8')) as Result;
    if (report.runtimeError) throw new Error('Lighthouse did not complete.');
    const categories = report.categories as Record<string, { score: number | null }>;
    const scores = Object.fromEntries(
      Object.entries(categories).map(([key, category]) => [key, category.score]),
    );
    console.log(profile, scores);
    if (Object.values(scores).some((score) => score === null)) process.exitCode = 1;
  }
} finally {
  await browser.close();
}
