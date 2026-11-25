// @vitest-environment node

import { mkdir, mkdtempDisposable, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runAudits } from '../../../scripts/check-lighthouse.ts';

const version = '13.6.0';
const fixtureCli = `
  const [href, ...args] = process.argv.slice(2);
  const path = new URL(href).pathname;
  const formFactor = args.includes('--preset=desktop') ? 'desktop' : 'mobile';
  if (path === '/lernen' && formFactor === 'mobile') {
    console.error('Synthetic Lighthouse navigation failure');
    process.exit(1);
  }
  const categories = args.find((arg) => arg.startsWith('--only-categories=')).split('=')[1];
  const score = path === '/' && categories.includes('seo') && formFactor === 'mobile' ? 0.95 : 0.97;
  console.log(JSON.stringify({
    audits: {},
    categories: Object.fromEntries(categories.split(',').map((name) => [name, { score }])),
    configSettings: { formFactor, throttlingMethod: 'simulate' },
    environment: {},
    fetchTime: new Date().toISOString(),
    finalDisplayedUrl: path === '/impressum' && formFactor === 'desktop' ? href + '?wrong' : href,
    gatherMode: 'navigation',
    lighthouseVersion: '${version}',
    mainDocumentUrl: href,
    requestedUrl: href,
  }));
`;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function withAuditFixture(
  all: boolean,
  check: (outputDirectory: string, passed: boolean, errors: unknown[][]) => Promise<void>,
) {
  await using temporary = await mkdtempDisposable(join(tmpdir(), 'ml-teaching-lighthouse-audits-'));
  const outputDirectory = temporary.path;
  const cli = join(outputDirectory, 'lighthouse.mjs');
  if (all) await seedReports(outputDirectory);
  await writeFile(cli, fixtureCli);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', (url: URL) => {
    const path = url.pathname;
    const status = path === '/datenschutz' ? 503 : Number(path.slice(1)) || 200;
    return Promise.resolve(
      new Response(null, { status, headers: { 'content-type': 'text/html' } }),
    );
  });
  const passed = await runAudits({
    all,
    outputDirectory,
    port: 4321,
    runtime: { cli, version, source: 'global', nodeVersion: process.versions.node },
  });
  await check(outputDirectory, passed, errors.mock.calls);
}

async function seedReports(outputDirectory: string) {
  for (const route of ['lernen', 'impressum', 'datenschutz']) {
    const directory = join(outputDirectory, 'routes', route);
    await mkdir(directory, { recursive: true });
    for (const profile of ['mobile', 'desktop'])
      await writeFile(join(directory, `${profile}.json`), 'old report');
  }
}

describe('Lighthouse audit results', () => {
  it('retains completed reports and fails after continuing past profile and route errors', async () => {
    await withAuditFixture(true, async (directory, passed, errors) => {
      const path = (...segments: string[]) => join(directory, 'routes', ...segments);
      expect(passed).toBe(false);
      expect(errors.map(([label]) => label)).toEqual([
        '/lernen mobile: Lighthouse audit failed.',
        '/impressum desktop: Lighthouse audit failed.',
        '/datenschutz mobile: Lighthouse audit failed.',
        '/datenschutz desktop: Lighthouse audit failed.',
      ]);
      await expect(readFile(path('lernen', 'mobile.json'))).rejects.toMatchObject({
        code: 'ENOENT',
      });
      await expect(readFile(path('impressum', 'desktop.json'))).rejects.toMatchObject({
        code: 'ENOENT',
      });
      await expect(readFile(path('datenschutz', 'mobile.json'))).rejects.toMatchObject({
        code: 'ENOENT',
      });
      await expect(readFile(path('datenschutz', 'desktop.json'))).rejects.toMatchObject({
        code: 'ENOENT',
      });
      const desktop = JSON.parse(await readFile(path('lernen', 'desktop.json'), 'utf8'));
      expect(desktop.configSettings.formFactor).toBe('desktop');
      const last = JSON.parse(await readFile(path('500', 'desktop.json'), 'utf8'));
      expect(last.categories).toEqual({ performance: { score: 0.97 } });
    });
  });

  it('keeps the valid report at the failing threshold and measures desktop in default mode', async () => {
    await withAuditFixture(false, async (directory, passed, errors) => {
      expect(passed).toBe(false);
      expect(errors).toEqual([
        [expect.stringContaining('Performance must exceed 95 points.'), expect.any(Object)],
      ]);
      const mobile = JSON.parse(await readFile(join(directory, 'mobile.json'), 'utf8'));
      expect(mobile.categories).toEqual({
        performance: { score: 0.95 },
        accessibility: { score: 0.95 },
        'best-practices': { score: 0.95 },
        seo: { score: 0.95 },
      });
      const desktop = JSON.parse(await readFile(join(directory, 'desktop.json'), 'utf8'));
      expect(desktop.categories.performance.score).toBe(0.97);
    });
  });
});
