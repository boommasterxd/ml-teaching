import { randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import cspConfig from '../csp.config.mjs';
import { noncePolicyFor } from '../csp/runtime/policy.mjs';

/** Native pageExtensions discovery excludes this entrypoint from production. */
export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Development CSP Proxy cannot execute outside next dev.');
  }
  const nonce = randomBytes(18).toString('base64');
  const policy = noncePolicyFor(nonce, cspConfig.policies);
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
    '/((?!_next/static/|_next/image(?:/|$)|_next/webpack-hmr(?:/|$)|favicon\\.svg$|brain-192\\.webp$|llms\\.txt$|robots\\.txt$|sitemap\\.xml$|opengraph-image$).*)',
  ],
};
