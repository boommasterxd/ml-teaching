import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/unit/**/*.test.{ts,tsx,mjs}'],
    exclude: ['test/e2e/**'],
    coverage: {
      provider: 'v8',
      include: [
        'src/hooks/**/*.ts',
        'src/lib/**/*.ts',
        'src/components/**/*.{ts,tsx}',
        'src/screens/TrainingPage.tsx',
        'src/screens/TrainingWorkspace.tsx',
        'src/app/error.tsx',
        'src/proxy.dev.ts',
      ],
      exclude: [
        'src/components/animate-ui/icons/**',
        'src/components/Footer.tsx',
        'src/components/PageContent.tsx',
        'src/components/PageHeader.tsx',
        'src/components/SiteLogo.tsx',
      ],
      thresholds: { lines: 85, statements: 85, functions: 85, branches: 80 },
      reporter: ['text', 'json-summary', 'html'],
    },
  },
});
