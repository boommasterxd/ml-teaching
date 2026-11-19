import { fileURLToPath } from 'node:url';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  adapterPath: fileURLToPath(new URL('./csp/adapter.mjs', import.meta.url)),
  poweredByHeader: false,
  images: { formats: ['image/avif', 'image/webp'] },
  experimental: {
    turbopackChunking: {
      minChunkSize: 150_000,
      maxChunkCountPerGroup: 6,
      maxMergeChunkSize: 500_000,
      priorityRoutes: [/^\/$/],
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
  if (phase !== PHASE_DEVELOPMENT_SERVER) return nextConfig;
  return {
    ...nextConfig,
    pageExtensions: ['dev.ts', ...defaultConfig.pageExtensions],
    allowedDevOrigins: process.env.NEXT_DEV_ALLOWED_ORIGIN
      ? [process.env.NEXT_DEV_ALLOWED_ORIGIN]
      : [],
  };
}
