import { createHash, randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { ERROR_RECOVERY_SPECULATION_RULES } from '@/lib/error-recovery-speculation';
import { THEME_BOOTSTRAP_SCRIPT } from '@/lib/theme';
import { ERROR_RECOVERY_STYLES, VIEW_TRANSITION_RESET } from '@/lib/view-transition-styles';
import cspConfig from '../csp.config.mjs';
import { noncePolicyFor } from '../csp/runtime/policy.mjs';

function sha256(inline: string) {
  return `sha256-${createHash('sha256').update(inline).digest('base64')}`;
}

const trustedHashes = {
  scripts: [THEME_BOOTSTRAP_SCRIPT, ERROR_RECOVERY_SPECULATION_RULES].map(sha256),
  styles: [
    sha256(ERROR_RECOVERY_STYLES),
    sha256(VIEW_TRANSITION_RESET),
    // Reviewed static reset stylesheet emitted by Animate UI's ThemeToggler.
    'sha256-x6C1Sk1PllDQ5Ec0yqO2UBK2XX4/B8tYMbKA36TdpJI=',
  ],
};

/** Native pageExtensions discovery excludes this entrypoint from production. */
export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Development CSP Proxy cannot execute outside next dev.');
  }
  const nonce = randomBytes(18).toString('base64');
  const policy = noncePolicyFor(nonce, cspConfig.policies, trustedHashes);
  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', policy);
  headers.delete('Content-Security-Policy-Report-Only');
  const response = NextResponse.next({ request: { headers } });
  response.headers.delete('Content-Security-Policy');
  response.headers.set('Content-Security-Policy-Report-Only', policy);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('CDN-Cache-Control', 'no-store');
  response.headers.set('Vercel-CDN-Cache-Control', 'no-store');
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static/|_next/image(?:/|$)|_next/(?:hmr|webpack-hmr)(?:/|$)|favicon\\.svg$|apple-icon\\.png$|llms\\.txt$|robots\\.txt$|sitemap\\.xml$|opengraph-image$).*)',
  ],
};
