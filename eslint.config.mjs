import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import sonarjs from 'eslint-plugin-sonarjs';
import { testFunctionLength } from './scripts/eslint-test-rules.ts';

const serverRoutes = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      client:
        'App Router pages/layouts must remain Server Components. Move interactivity to a client child.',
    },
  },
  create(context) {
    return {
      Program(node) {
        for (const statement of node.body) {
          if (statement.type !== 'ExpressionStatement' || !statement.directive) break;
          if (statement.directive === 'use client')
            context.report({ node: statement, messageId: 'client' });
        }
      },
    };
  },
};

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    '.next/**',
    'out/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
    '.agents/**',
  ]),
  { linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: 'error' } },
  {
    rules: {
      // React Compiler is not enabled; its library-adoption check does not apply.
      'react-hooks/incompatible-library': 'off',
    },
  },
  {
    files: [
      '*.{js,mjs,cjs,ts,tsx}',
      'src/**/*.{js,jsx,ts,tsx}',
      'scripts/**/*.{ts,mjs}',
      '.github/scripts/**/*.{ts,mjs}',
      'test/**/*.{ts,tsx,mjs}',
    ],
    plugins: { sonarjs },
    rules: {
      complexity: ['error', 20],
      'sonarjs/cognitive-complexity': ['error', 25],
      'max-depth': ['error', 4],
      'max-params': ['error', 6],
      'max-lines': ['error', { max: 500, skipBlankLines: false, skipComments: false }],
      'max-lines-per-function': [
        'error',
        { max: 100, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
    },
  },
  {
    files: ['test/**/*.{ts,tsx,mjs}'],
    plugins: { quality: { rules: { 'test-function-length': testFunctionLength } } },
    rules: {
      'max-lines-per-function': 'off',
      'quality/test-function-length': [
        'error',
        { max: 100, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
    },
  },
  {
    files: ['src/app/**/{page,layout}.{js,jsx,ts,tsx,dev.ts}'],
    plugins: { architecture: { rules: { 'server-routes': serverRoutes } } },
    rules: { 'architecture/server-routes': 'error' },
  },
  {
    files: ['src/components/animate-ui/icons/smartphone.tsx'],
    // Preserve the registry's static SVG paths without rewriting upstream geometry.
    rules: { 'max-lines-per-function': 'off' },
  },
  { files: ['src/components/SiteLogo.tsx'], rules: { '@next/next/no-img-element': 'off' } },
  {
    files: ['src/components/network/NetworkScene.tsx'],
    // Native getImageProps retains optimization while CSS replaces Image's CSP-blocked initial style.
    rules: { '@next/next/no-img-element': 'off' },
  },
]);
