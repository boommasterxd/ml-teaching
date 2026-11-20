import { isAbsolute } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import process from 'node:process';
import { createHashCspAdapter } from './runtime/adapter.mjs';
import options from '../csp.config.mjs';

// Compose the already installed provider adapter. Never import the CSP adapter into itself.
const providerPath = process.env.CSP_PROVIDER_ADAPTER || process.env.NEXT_ADAPTER_PATH;
if (
  providerPath &&
  (!isAbsolute(providerPath) || providerPath === fileURLToPath(import.meta.url))
) {
  throw new Error(
    'Select an absolute existing provider adapter path distinct from the CSP adapter',
  );
}
if (process.env.VERCEL === '1' && !providerPath) {
  throw new Error('Vercel requires explicit composition with its installed native Next.js adapter');
}
const providerAdapter = providerPath
  ? (await import(pathToFileURL(providerPath).href)).default
  : undefined;

export default createHashCspAdapter({ ...options, providerAdapter });
