/**
 * Vite configuration file for the Teachable Machine application.
 * Configures React and Tailwind CSS plugins, path aliases, and development server settings.
 */

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { compression } from 'vite-plugin-compression2';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

/** Vite build configuration with chunk splitting, image optimization, and compression. */
export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      compression({ algorithm: 'gzip', exclude: [/\.(br)$/, /\.(gz)$/] } as any),
      compression({ algorithm: 'brotliCompress', exclude: [/\.(br)$/, /\.(gz)$/] } as any),
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
      chunkSizeWarningLimit: 1500,
      modulePreload: { polyfill: true },
      rollupOptions: {
        output: {
          /** Splits large dependencies into named chunks to improve caching and load times. */
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
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
