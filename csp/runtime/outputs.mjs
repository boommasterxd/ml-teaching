import { readFile, realpath } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { containedFile, readArtifact, readJson, replaceArtifact } from './artifacts.mjs';
import { assetHashes, digest, prepareDocument } from './html.mjs';
import { policyFor } from './policy.mjs';
import { assertCacheHeaders, browserCacheRoute } from './browser-cache.mjs';

/** @param {string} value */
function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

/** @param {string} route */
export function validateRoute(route) {
  if (!/^\/(?:[a-zA-Z0-9_-]+(?:[./][a-zA-Z0-9_-]+)*)?$/u.test(route) || route.includes('..')) {
    throw new Error(`Unsupported canonical static route: ${route}`);
  }
}

/** @param {import('./types.js').BuildContext} context @param {string[]} routes */
function selectDocuments(context, routes) {
  /** @type {import('./types.js').DocumentOutput[]} */
  const documents = [];
  for (const pathname of routes) {
    validateRoute(pathname);
    const prerenders = context.outputs.prerenders.filter(
      (item) => item.pathname === pathname && item.fallback?.filePath?.endsWith('.html'),
    );
    const staticFiles = context.outputs.staticFiles.filter(
      (item) => item.pathname === pathname && item.filePath.endsWith('.html'),
    );
    if (prerenders.length + staticFiles.length !== 1) {
      throw new Error(`Expected exactly one complete static HTML output: ${pathname}`);
    }
    const output = prerenders[0];
    if (output) assertStatic(output);
    const filePath = output?.fallback?.filePath ?? staticFiles[0]?.filePath;
    if (!filePath) throw new Error(`Missing static HTML: ${pathname}`);
    const aliases = output
      ? context.outputs.prerenders
          .filter((item) => item.groupId === output.groupId)
          .map((item) => item.pathname)
      : [];
    for (const alias of aliases) validateRoute(alias);
    documents.push({
      pathname,
      filePath,
      aliases: [...new Set([pathname, ...aliases])],
      fallback: output?.fallback,
    });
  }
  return documents;
}

/** @param {import('./types.js').PrerenderOutput} output */
function assertStatic(output) {
  if (
    output.fallback?.initialRevalidate !== false ||
    output.fallback.postponedState !== undefined ||
    output.config.partialFallback ||
    (output.compute !== undefined && output.compute !== 'static') ||
    (output.response !== undefined && output.response !== 'complete') ||
    (output.config.renderingMode !== undefined && output.config.renderingMode !== 'STATIC')
  ) {
    throw new Error(`ISR/PPR or incomplete output cannot use fixed hash CSP: ${output.pathname}`);
  }
}

/** @param {import('./types.js').BuildContext} context */
async function scriptAssets(context) {
  const outputs = new Map();
  for (const output of context.outputs.staticFiles) {
    if (!output.pathname.startsWith('/_next/static/') || !output.pathname.endsWith('.js')) continue;
    if (outputs.has(output.pathname))
      throw new Error(`Duplicate script output: ${output.pathname}`);
    outputs.set(output.pathname, output.filePath);
  }
  const root = await realpath(context.distDir);
  /** @type {Map<string, ReturnType<typeof assetHashes>>} */
  const loaded = new Map();
  return {
    /** @param {string} pathname */
    async get(pathname) {
      const file = outputs.get(pathname);
      if (!file) return undefined;
      const canonical = await containedFile(root, file);
      let hashes = loaded.get(canonical);
      if (!hashes) {
        hashes = assetHashes(await readFile(canonical));
        loaded.set(canonical, hashes);
      }
      return hashes;
    },
    identities: () =>
      [...loaded].map(([file, hashes]) => ({ file: relative(root, file), hash: hashes.sha256 })),
  };
}

/** @param {import('./types.js').DocumentOutput} output */
export function outputPattern(output) {
  return `^(?:${output.aliases.map((path) => escaped(path) + (path === '/' || path.endsWith('.rsc') ? '' : '/?')).join('|')})$`;
}

/** @param {import('./types.js').DocumentOutput} output */
export function outputPaths(output) {
  return output.aliases.flatMap((path) =>
    path === '/' || path.endsWith('.rsc') ? [path] : [path, `${path}/`],
  );
}

/** @param {import('./types.js').BuildContext} context @param {import('./types.js').PreparedOutput[]} documents
 * @param {string | undefined} fallbackPolicy @param {import('./types.js').Options} options */
export async function persistNativeHeaders(context, documents, fallbackPolicy, options) {
  const file = join(context.distDir, 'routes-manifest.json');
  const manifest = await readJson(context.distDir, file);
  if (manifest.version !== 3 || !Array.isArray(manifest.headers)) {
    throw new Error('Unsupported native Next.js routes manifest schema');
  }
  for (const document of documents) {
    const cache = browserCacheRoute(document, options);
    for (const rule of manifest.headers) {
      if (
        outputPaths(document).some((path) => new RegExp(rule.regex, 'u').test(path)) &&
        rule.headers.some((/** @type {{key: string}} */ header) =>
          /content-security-policy/iu.test(header.key),
        )
      ) {
        throw new Error(`Competing native CSP header: ${document.pathname}`);
      }
      if (cache && outputPaths(document).some((path) => new RegExp(rule.regex, 'u').test(path))) {
        for (const header of rule.headers) {
          assertCacheHeaders({ [header.key]: header.value }, document.pathname);
        }
      }
    }
  }
  if (fallbackPolicy)
    manifest.headers.unshift({
      source: '/:path*',
      regex: '^/(?!_next/static/).*$',
      headers: [{ key: 'Content-Security-Policy', value: fallbackPolicy }],
    });
  for (const document of documents)
    manifest.headers.push({
      source: document.pathname,
      regex: outputPattern(document),
      headers: [{ key: 'Content-Security-Policy', value: document.policy }],
    });
  for (const document of documents) {
    const cache = browserCacheRoute(document, options);
    if (cache)
      manifest.headers.push({
        source: cache.source,
        regex: cache.sourceRegex,
        missing: cache.missing,
        headers: [{ key: 'Cache-Control', value: cache.headers['Cache-Control'] }],
      });
  }
  await replaceArtifact(context.distDir, file, JSON.stringify(manifest));
  return file;
}

/** @param {import('./types.js').BuildContext} context @param {import('./types.js').Options} options */
export async function prepareOutputs(context, options) {
  const documents = selectDocuments(context, [...options.routes, ...(options.errorRoutes ?? [])]);
  const assets = await scriptAssets(context);
  /** @type {import('./types.js').PreparedOutput[]} */
  const prepared = [];
  for (const document of documents) {
    const original = await readArtifact(context.distDir, document.filePath);
    const result = await prepareDocument(original, assets, context.config.deploymentId);
    prepared.push({
      ...document,
      ...result,
      inputDigest: digest(original),
      policy: policyFor(result, options.policies),
    });
  }
  return { documents: prepared, assetIdentities: assets.identities() };
}
