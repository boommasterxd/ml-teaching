import { fileURLToPath } from 'node:url';
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from 'next/constants.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  adapterPath: fileURLToPath(new URL('./csp/adapter.mjs', import.meta.url)),
  poweredByHeader: false,
  skipTrailingSlashRedirect: true,
  async redirects() {
    // Keep the public slash redirect after the shared headers in provider routing.
    return [
      {
        source: '/:path((?!_next)[^/]+(?:/[^/]+)*)/',
        destination: '/:path',
        permanent: true,
      },
    ];
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200],
    formats: ['image/avif', 'image/webp'],
    localPatterns: [
      { pathname: '/_next/static/media/**', search: '' },
      { pathname: '/_next/static/immutable/media/**', search: '' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(), browsing-topics=()',
          },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
      {
        source: '/404',
        missing: [{ type: 'header', key: 'rsc' }],
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
};

/** @param {string} phase @param {{defaultConfig: {pageExtensions: string[]}}} context */
export default function configureNext(phase, { defaultConfig }) {
  if (phase === PHASE_PRODUCTION_BUILD) {
    return { ...nextConfig, typescript: { tsconfigPath: 'tsconfig.build.json' } };
  }
  if (phase !== PHASE_DEVELOPMENT_SERVER) return nextConfig;
  return {
    ...nextConfig,
    pageExtensions: ['dev.ts', ...defaultConfig.pageExtensions],
    allowedDevOrigins: process.env.NEXT_DEV_ALLOWED_ORIGIN
      ? [process.env.NEXT_DEV_ALLOWED_ORIGIN]
      : [],
  };
}
