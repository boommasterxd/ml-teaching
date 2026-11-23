import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import base from '../../playwright.config';

const { webServer: server, ...config } = base;
if (!server || Array.isArray(server)) throw new Error('Expected one native production server.');

export default defineConfig(config, {
  testDir: '.',
  testMatch: 'mobilenet-provider.smoke.ts',
  timeout: 60_000,
  use: { serviceWorkers: 'block', trace: 'off' },
  webServer: { ...server, cwd: fileURLToPath(new URL('../../', import.meta.url)) },
});
