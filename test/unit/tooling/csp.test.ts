import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempDisposableSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import options from '../../../csp.config.mjs';
import { optionsDigest } from '../../../csp/runtime/artifacts.mjs';
import { proxy } from '../../../src/proxy.dev.ts';

afterEach(() => vi.unstubAllEnvs());

it('verifies matching static output and rejects a stale build or changed document', () => {
  using fixture = mkdtempDisposableSync(join(tmpdir(), 'ml-teaching-build-'));
  const command = resolve('csp/check-build.mjs');
  const dist = join(fixture.path, '.next');
  const next = join(fixture.path, 'node_modules', 'next');
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
      cwd: fixture.path,
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
});

it('refuses a configured provider adapter without its required build hook', () => {
  using fixture = mkdtempDisposableSync(join(tmpdir(), 'ml-teaching-provider-'));
  const provider = join(fixture.path, 'provider.mjs');
  writeFileSync(provider, 'export default { name: "fixture" };');
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
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('The existing provider adapter must implement onBuildComplete');
});

it('uses an independent report-only policy in development and rejects production Proxy execution', () => {
  const request = new NextRequest('http://localhost:3101', {
    headers: { 'x-nonce': 'caller-value', 'content-security-policy': 'default-src *' },
  });
  vi.stubEnv('NODE_ENV', 'development');
  const { headers } = proxy(request);
  const policy = headers.get('content-security-policy-report-only');
  const nonce = policy?.match(/'nonce-([^']+)'/)?.[1];
  expect(nonce).toMatch(/^[A-Za-z0-9+/]{24}$/);
  expect(headers.get('x-middleware-request-x-nonce')).toBe(nonce);
  expect(headers.get('x-middleware-request-content-security-policy')).toBe(policy);
  expect(policy).toContain("frame-ancestors 'none'");
  expect(policy).not.toContain('caller-value');
  expect(headers.has('content-security-policy')).toBe(false);
  expect(headers.get('cache-control')).toBe('private, no-store');
  expect(proxy(request).headers.get('content-security-policy-report-only')).not.toBe(policy);

  vi.stubEnv('NODE_ENV', 'production');
  expect(() => proxy(request)).toThrow('outside next dev');
});
