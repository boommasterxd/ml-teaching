import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'learning',
          include: ['test/unit/learning/**/*.test.{ts,tsx,mjs}'],
          environment: 'jsdom',
          setupFiles: ['./test/setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'training',
          include: ['test/unit/training/**/*.test.{ts,tsx,mjs}'],
          environment: 'jsdom',
          setupFiles: ['./test/setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'tooling',
          include: ['test/unit/tooling/**/*.test.{ts,tsx,mjs}'],
          environment: 'node',
        },
      },
    ],
  },
});
