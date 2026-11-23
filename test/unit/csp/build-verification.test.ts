// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';
import options from '../../../csp.config.mjs';
import { optionsDigest } from '../../../csp/runtime/artifacts.mjs';

it.each([
  {
    description: 'rejects a configured provider with only a named export',
    source: 'export function onBuildComplete() {}',
    expectedError: 'The configured provider adapter must have a usable default export',
  },
  {
    description: 'rejects a provider with a non-callable build hook',
    source: 'export default { name: "fixture", onBuildComplete: true };',
    expectedError: 'The existing provider adapter must implement onBuildComplete',
  },
  {
    description: 'accepts a provider with a build hook and no modifyConfig hook',
    source: 'export default { name: "fixture", onBuildComplete() {} };',
    expectedError: null,
  },
])('$description', ({ source, expectedError }) => {
  const fixture = mkdtempSync(join(tmpdir(), 'ml-teaching-provider-'));
  const provider = join(fixture, 'provider.mjs');
  writeFileSync(provider, source);
  try {
    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `const { default: adapter } = await import('./csp/adapter.mjs');
        await adapter.modifyConfig({ adapterPath: 'wrapper' }, { phase: 'phase-development-server' });`,
      ],
      {
        encoding: 'utf8',
        env: { ...process.env, VERCEL: '1', CSP_PROVIDER_ADAPTER: provider },
        timeout: 10_000,
      },
    );

    expect(result.status, result.stderr).toBe(expectedError ? 1 : 0);
    if (expectedError) expect(result.stderr).toContain(expectedError);
  } finally {
    unlinkSync(provider);
    rmdirSync(fixture);
  }
});

it('verifies matching static output and rejects a stale build or changed document', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'ml-teaching-build-'));
  const command = resolve('csp/check-build.mjs');
  try {
    const dist = join(fixture, '.next');
    const next = join(fixture, 'node_modules', 'next');
    mkdirSync(dist);
    mkdirSync(next, { recursive: true });
    const { version } = createRequire(import.meta.url)('next/package.json') as { version: string };
    writeFileSync(join(next, 'package.json'), JSON.stringify({ version }));

    const buildId = join(dist, 'BUILD_ID');
    const document = join(dist, 'index.html');
    const html = '<!doctype html><title>Static build fixture</title>';
    const hash = `sha256-${createHash('sha256').update(html).digest('base64')}`;
    writeFileSync(buildId, 'fixture-one');
    writeFileSync(document, html);
    writeFileSync(
      join(dist, 'hash-csp-manifest.json'),
      JSON.stringify({
        version: 1,
        buildId: 'fixture-one',
        nextVersion: version,
        optionsDigest: optionsDigest(options),
        files: { 'index.html': hash },
      }),
    );

    const verify = () =>
      spawnSync(process.execPath, [command, 'verify'], {
        cwd: fixture,
        encoding: 'utf8',
        timeout: 10_000,
      });

    const ok = verify();
    expect(ok.status, ok.stderr).toBe(0);

    writeFileSync(buildId, 'fixture-two');
    const stale = verify();
    expect(stale.status).toBe(1);
    expect(stale.stderr).toContain('Stale or incompatible hash CSP manifest');

    writeFileSync(buildId, 'fixture-one');
    writeFileSync(document, '<!doctype html><title>Different build fixture</title>');
    const changed = verify();
    expect(changed.status).toBe(1);
    expect(changed.stderr).toContain('Hash CSP artifact changed after build: index.html');
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
