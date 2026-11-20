import { glob } from 'node:fs/promises';
import { join } from 'node:path';
import { readArtifact, readJson } from './artifacts.mjs';
import { digest } from './html.mjs';

/**
 * Native App Router adapters can expose /404 while next start uses the owned _not-found seed.
 * Refuse producer/owner drift instead of assuming that the two documents are equivalent.
 * @param {import('./types.js').BuildContext} context
 * @param {import('./types.js').PreparedOutput[]} documents
 */
export async function nativeErrorCopies(context, documents) {
  const document = documents.find((item) => item.pathname === '/404');
  if (!document || !context.outputs.appPages?.some((item) => item.pathname === '/_not-found'))
    return [];
  /** @type {import('./types.js').PreparedOutput[]} */
  const copies = [];
  for await (const file of glob('server/route-cache/APP_PAGE/*/$/_not-found.html', {
    cwd: context.distDir,
  })) {
    if (copies.length >= 16) throw new Error('Unexpected number of native error copies');
    const filePath = join(context.distDir, file);
    const meta = await readJson(context.distDir, filePath.replace(/\.html$/u, '.meta'));
    if (
      meta.routeCache?.owner?.kind !== 'APP_PAGE' ||
      meta.routeCache?.owner?.sourceRoute !== '/_not-found/page' ||
      meta.status !== 404 ||
      meta.postponed !== undefined ||
      digest(await readArtifact(context.distDir, filePath)) !== document.inputDigest
    ) {
      throw new Error('Native 404 seed differs from the public adapter output');
    }
    copies.push({ ...document, filePath, fallback: { filePath } });
  }
  if (copies.length !== 1) throw new Error('Missing or ambiguous native 404 seed');
  return copies;
}
