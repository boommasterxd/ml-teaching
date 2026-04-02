/**
 * vite.config.ts
 *
 * Vite build configuration for the Teachable Machine application.
 * Sets up React, Tailwind CSS, gzip/Brotli compression, image optimization,
 * manual chunk splitting for large dependencies, path aliases, and the dev server.
 */

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vitest/config';
import { compression } from 'vite-plugin-compression2';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Emit pre-compressed .gz files alongside every asset.
      // Already-compressed files are excluded to prevent double-compression.
      compression({ algorithms: ['gzip'], exclude: [/\.(br)$/, /\.(gz)$/] }),
      // Emit pre-compressed .br files alongside every asset.
      // Already-compressed files are excluded to prevent double-compression.
      compression({ algorithms: ['brotliCompress'], exclude: [/\.(br)$/, /\.(gz)$/] }),
      // Lossy image optimization at quality 80 for PNG, JPEG, and WebP;
      // AVIF uses quality 70 to balance file size against visual fidelity.
      ViteImageOptimizer({
        png: {
          quality: 80,
        },
        jpeg: {
          quality: 80,
        },
        jpg: {
          quality: 80,
        },
        webp: { lossless: false, quality: 80 },
        avif: { lossless: false, quality: 70 },
      }),
    ],
    build: {
      // Raise the warning threshold to accommodate large TensorFlow.js chunks.
      chunkSizeWarningLimit: 1500,
      // Skip injecting the modulepreload polyfill — modern browsers handle it natively.
      modulePreload: { polyfill: false },
      rollupOptions: {
        output: {
          /**
           * Assigns each node_modules dependency to a named chunk so that
           * large libraries (React, TensorFlow.js, Framer Motion, Lucide) are
           * cached independently and only re-downloaded when they actually change.
           *
           * @param id - Absolute path of the module being processed by Rollup.
           * @returns The target chunk name, or `undefined` to use Rollup's default.
           */
          manualChunks(id): string | undefined {
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) {
                return 'lucide';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'react';
              }
              if (id.includes('@tensorflow')) {
                return 'tfjs';
              }
              if (id.includes('motion')) {
                return 'motion';
              }
              return 'vendor';
            }
            return undefined;
          }
        }
      }
    },
    resolve: {
      // Map the `@` alias to the project root so imports stay short and portable.
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
    },
    server: {
      // Bind to all interfaces so the dev server is reachable inside Docker.
      host: '0.0.0.0',
      port: 3000,
      // Allow disabling HMR via environment variable (useful in CI or containerised setups).
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
