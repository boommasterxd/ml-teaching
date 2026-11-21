import { fileURLToPath } from 'node:url';
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from 'next/constants.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  adapterPath: fileURLToPath(new URL('./csp/adapter.mjs', import.meta.url)),
  poweredByHeader: false,
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200],
    formats: ['image/avif', 'image/webp'],
    localPatterns: [
      { pathname: '/_next/static/media/**', search: '' },
      { pathname: '/_next/static/immutable/media/**', search: '' },
    ],
  },
  experimental: {
    turbopackChunking: {
      minChunkSize: 700_000,
      maxChunkCountPerGroup: 2,
      maxMergeChunkSize: 2_500_000,
      firstPageLoadPriority: 1,
      priorityBoost: 5,
      requestCost: 1_500_000,
      generateComponentChunks: true,
      minComponentChunkSize: 100_000,
      priorityRoutes: [/^\/$/, /^\/(?:500|_not-found|datenschutz)$/],
    },
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
