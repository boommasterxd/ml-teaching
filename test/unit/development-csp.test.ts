// @vitest-environment node
import { createHash } from 'node:crypto';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeToggler } from '@animate-ui/react/primitives/effects/theme-toggler';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from 'next/constants.js';
import configureNext from '../../next.config.mjs';
import { config, proxy } from '../../src/proxy.dev';
import { ERROR_RECOVERY_SPECULATION_RULES } from '@/lib/error-recovery-speculation';
import { THEME_BOOTSTRAP_SCRIPT } from '@/lib/theme';
import { ERROR_RECOVERY_STYLES, VIEW_TRANSITION_RESET } from '@/lib/view-transition-styles';

const defaults = { defaultConfig: { pageExtensions: ['tsx', 'ts', 'jsx', 'js'] } };
const origin = 'http://localhost:3101';

function sourceHash(inline: string) {
  return `'sha256-${createHash('sha256').update(inline).digest('base64')}'`;
}

afterEach(() => vi.unstubAllEnvs());

describe('development-only CSP transport', () => {
  it('forwards a fresh trusted nonce and reports rather than enforcing the canonical policy', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const request = new NextRequest(origin, {
      headers: {
        'x-nonce': 'attacker',
        'Content-Security-Policy': 'default-src *',
        'Content-Security-Policy-Report-Only': 'default-src *',
      },
    });
    const response = proxy(request);
    const policy = response.headers.get('Content-Security-Policy-Report-Only')!;
    const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce).toMatch(/^[A-Za-z0-9+/]{24}$/);
    expect(policy).toContain("script-src 'strict-dynamic'");
    expect(policy).toContain("style-src-attr 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).not.toMatch(/attacker|unsafe-inline|unsafe-eval|default-src \*/);
    expect(response.headers.has('Content-Security-Policy')).toBe(false);
    expect(response.headers.has('x-nonce')).toBe(false);
    expect(response.headers.get('x-middleware-request-content-security-policy')).toBe(policy);
    expect(response.headers.get('x-middleware-request-x-nonce')).toBe(nonce);
    expect(response.headers.get('x-middleware-override-headers')).not.toContain(
      'content-security-policy-report-only',
    );
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('CDN-Cache-Control')).toBe('no-store');
    expect(response.headers.get('Vercel-CDN-Cache-Control')).toBe('no-store');
    expect(proxy(request).headers.get('Content-Security-Policy-Report-Only')).not.toBe(policy);
  });

  it('cannot execute in production or an unknown runtime mode', () => {
    for (const mode of ['production', 'test']) {
      vi.stubEnv('NODE_ENV', mode);
      expect(() => proxy(new NextRequest(origin))).toThrow('outside next dev');
    }
  });

  it('authorizes the exact trusted scripts and styles by hash in their own directives', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { headers } = proxy(new NextRequest(origin));
    const policy = headers.get('Content-Security-Policy-Report-Only')!;
    const themeMarkup = renderToStaticMarkup(
      createElement(ThemeToggler, { theme: 'system', resolvedTheme: 'light', setTheme: vi.fn() }),
    );
    const themeStyle = themeMarkup.match(/<style>([^<]+)<\/style>/u)?.[1];
    expect(themeStyle).toBeTruthy();
    const sources = (directive: string) =>
      policy
        .split('; ')
        .find((part) => part.startsWith(directive + ' '))
        ?.split(' ')
        .filter((token) => token.startsWith("'sha256-"));
    expect(sources('script-src')).toEqual(
      [THEME_BOOTSTRAP_SCRIPT, ERROR_RECOVERY_SPECULATION_RULES].map(sourceHash),
    );
    expect(sources('style-src')).toEqual(
      [ERROR_RECOVERY_STYLES, VIEW_TRANSITION_RESET, themeStyle!].map(sourceHash),
    );
  });

  it('exposes the compound Proxy extension only to the native development phase', () => {
    vi.stubEnv('NEXT_DEV_ALLOWED_ORIGIN', '');
    expect(configureNext(PHASE_DEVELOPMENT_SERVER, defaults).pageExtensions).toEqual([
      'dev.ts',
      ...defaults.defaultConfig.pageExtensions,
    ]);
    expect(configureNext(PHASE_DEVELOPMENT_SERVER, defaults).allowedDevOrigins).toEqual([]);
    vi.stubEnv('NEXT_DEV_ALLOWED_ORIGIN', 'machine.example.ts.net');
    expect(configureNext(PHASE_DEVELOPMENT_SERVER, defaults).allowedDevOrigins).toEqual([
      'machine.example.ts.net',
    ]);
    for (const phase of [PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER, 'unknown']) {
      const production = configureNext(phase, defaults);
      expect(production.pageExtensions).toBeUndefined();
      expect(production.allowedDevOrigins).toBeUndefined();
      expect(production.adapterPath).toContain('/csp/adapter.mjs');
    }
  });

  it('covers documents and native errors while excluding known asset and HMR endpoints', () => {
    const nextConfig = configureNext(PHASE_DEVELOPMENT_SERVER, defaults);
    for (const path of [
      '/',
      '/lernen',
      '/lernen.rsc',
      '/500',
      '/unknown.png',
      '/favicon.svg/missing',
      '/favicon-light.svg',
      '/favicon-dark.svg',
    ]) {
      expect(unstable_doesMiddlewareMatch({ config, nextConfig, url: origin + path })).toBe(true);
    }
    for (const path of [
      '/_next/static/runtime.js',
      '/_next/image?url=%2Fapple-icon.png&w=64&q=75',
      '/_next/hmr',
      '/_next/webpack-hmr',
      '/favicon.svg',
      '/apple-icon.png',
      '/robots.txt',
    ]) {
      expect(unstable_doesMiddlewareMatch({ config, nextConfig, url: origin + path })).toBe(false);
    }
  });
});
