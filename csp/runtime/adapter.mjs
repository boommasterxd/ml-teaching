import { readFile, rm, realpath } from 'node:fs/promises';
import { join, relative } from 'node:path';
import {
  artifactIdentity,
  buildDirectory,
  containedFile,
  manifestName,
  optionsDigest,
  readJson,
  replaceArtifact,
  verifyBuild,
  writeAtomic,
} from './artifacts.mjs';
import {
  errorFallbackRegex,
  errorFallbackSource,
  outputPaths,
  outputPattern,
  persistNativeHeaders,
  prepareOutputs,
  validateRoute,
} from './outputs.mjs';
import { policyFor } from './policy.mjs';
import { nativeErrorCopies } from './native-errors.mjs';
import { assertCacheHeaders, browserCacheRoute, browserMaxAge } from './browser-cache.mjs';

/** @param {import('./types.js').Options} options */
function validateOptions(options) {
  browserMaxAge(options);
  const routes = [...options.routes, ...(options.errorRoutes ?? [])];
  if (!options.routes.length || routes.length > 1000 || new Set(routes).size !== routes.length) {
    throw new Error('Select 1-1000 unique static routes and error routes explicitly');
  }
  routes.forEach(validateRoute);
  if (options.providerAdapter && typeof options.providerAdapter.onBuildComplete !== 'function') {
    throw new Error('The existing provider adapter must implement onBuildComplete');
  }
}

/** @param {import('./types.js').AppConfig} config */
function assertOutputMode(config) {
  if (config.basePath || config.i18n || config.output) {
    throw new Error(
      'Hash CSP boilerplate requires App Router native output without basePath/i18n/standalone/export',
    );
  }
}

/** @param {import('./types.js').BuildContext} context @param {import('./types.js').PreparedOutput[]} documents */
function assertNoProxy(context, documents) {
  const matchers = [
    ...context.routing.middlewareMatchers,
    ...(context.outputs.middleware?.config.matchers ?? []),
  ];
  for (const document of documents) {
    if (
      matchers.some((rule) =>
        outputPaths(document).some((pathname) => new RegExp(rule.sourceRegex, 'u').test(pathname)),
      )
    ) {
      throw new Error(`Static route still executes Proxy/Middleware: ${document.pathname}`);
    }
  }
}

/** @param {Record<string, unknown>} headers @param {string} pathname */
function assertNoPolicy(headers, pathname) {
  if (Object.keys(headers).some((key) => /content-security-policy/iu.test(key))) {
    throw new Error(`Competing prerender CSP header: ${pathname}`);
  }
}

/** Persist only the existing native prerender metadata; no request rewriting.
 * @param {import('./types.js').BuildContext} context @param {import('./types.js').PreparedOutput} document
 * @param {import('./types.js').Options} options
 */
async function persistDocument(context, document, options) {
  assertNoPolicy(document.fallback?.initialHeaders ?? {}, document.pathname);
  const normalPage = !options.errorRoutes?.includes(document.pathname);
  if (normalPage) assertCacheHeaders(document.fallback?.initialHeaders ?? {}, document.pathname);
  const files = [document.filePath];
  if (document.fallback) {
    const metaFile = document.filePath.replace(/\.html$/u, '.meta');
    const meta = await readJson(context.distDir, metaFile);
    assertNoPolicy(meta.headers ?? {}, document.pathname);
    if (normalPage) assertCacheHeaders(meta.headers ?? {}, document.pathname);
    // Native routing already sets the policy on regular pages. Next appends any
    // policy from their prerender metadata to that same response.
    if (!normalPage || options.providerAdapter) {
      meta.headers = { ...meta.headers, 'content-security-policy': document.policy };
      await replaceArtifact(context.distDir, metaFile, JSON.stringify(meta));
      document.fallback.initialHeaders = {
        ...document.fallback.initialHeaders,
        'content-security-policy': document.policy,
      };
    }
    files.push(metaFile);
  }
  await replaceArtifact(context.distDir, document.filePath, document.html);
  return files;
}

/** @param {import('./types.js').BuildContext} context @param {import('./types.js').Options} options */
async function buildPolicies(context, options) {
  assertOutputMode(context.config);
  if (
    !Array.isArray(context.routing?.beforeMiddleware) ||
    !Array.isArray(context.routing.middlewareMatchers)
  ) {
    throw new Error('Unsupported native adapter routing API');
  }
  if (!Array.isArray(context.outputs?.staticFiles) || !Array.isArray(context.outputs.prerenders)) {
    throw new Error('Unsupported native adapter output API');
  }
  const buildId = (
    await readFile(await containedFile(context.distDir, join(context.distDir, 'BUILD_ID')), 'utf8')
  ).trim();
  if (buildId !== context.buildId) throw new Error('Adapter build ID differs from native output');
  const { documents, assetIdentities } = await prepareOutputs(context, options);
  const errorCopies = await nativeErrorCopies(context, documents);
  assertNoProxy(context, documents);
  const errors = documents.filter((document) => options.errorRoutes?.includes(document.pathname));
  const fallbackPolicy = errors.length
    ? policyFor(
        {
          scripts: [...new Set(errors.flatMap((document) => document.scripts))],
          styles: [...new Set(errors.flatMap((document) => document.styles))],
        },
        options.policies,
      )
    : undefined;
  const nativeFile = await persistNativeHeaders(context, documents, fallbackPolicy, options);
  if (fallbackPolicy)
    context.routing.beforeMiddleware.unshift({
      source: errorFallbackSource,
      sourceRegex: errorFallbackRegex,
      headers: { 'Content-Security-Policy': fallbackPolicy },
    });
  const files = [
    nativeFile,
    join(context.distDir, 'prerender-manifest.json'),
    join(context.distDir, 'server/middleware-manifest.json'),
  ];
  for (const document of documents) {
    const cacheRoute = browserCacheRoute(document, options);
    if (cacheRoute) {
      for (const route of context.routing.beforeMiddleware) {
        if (outputPaths(document).some((path) => new RegExp(route.sourceRegex, 'u').test(path))) {
          assertCacheHeaders(route.headers ?? {}, document.pathname);
        }
      }
    }
    files.push(...(await persistDocument(context, document, options)));
    context.routing.beforeMiddleware.push({
      source: document.pathname,
      sourceRegex: outputPattern(document),
      headers: { 'Content-Security-Policy': document.policy },
    });
    if (cacheRoute) context.routing.beforeMiddleware.push(cacheRoute);
  }
  for (const copy of errorCopies) files.push(...(await persistDocument(context, copy, options)));
  const identities = [
    ...assetIdentities,
    ...(await Promise.all(
      [...new Set(files)].map((file) => artifactIdentity(context.distDir, file)),
    )),
  ];
  /** @type {import('./types.js').Manifest} */
  const manifest = {
    version: 1,
    buildId,
    nextVersion: context.nextVersion,
    optionsDigest: optionsDigest(options),
    files: Object.fromEntries(identities.map(({ file, hash }) => [file, hash])),
    policies: Object.fromEntries(documents.map((document) => [document.pathname, document.policy])),
  };
  return manifest;
}

/**
 * Copy this directory as a unit. Hash trusted build producers only, never unsanitized user/CMS HTML.
 * @param {import('./types.js').Options} options
 */
export function createHashCspAdapter(options) {
  validateOptions(options);
  return {
    name: 'static-hash-csp',
    /** @param {import('./types.js').AppConfig} config @param {import('./types.js').ConfigContext} context */
    async modifyConfig(config, context) {
      const wrapperPath = config.adapterPath;
      const modified = (await options.providerAdapter?.modifyConfig?.(config, context)) ?? config;
      if (modified.adapterPath !== wrapperPath)
        throw new Error('Provider adapter replaced or removed the hash CSP adapterPath');
      if (context.phase === 'phase-development-server') return modified;
      assertOutputMode(modified);
      const root = await buildDirectory(context.projectDir, modified.distDir);
      if (context.phase === 'phase-production-build')
        await rm(join(root, manifestName), { force: true });
      if (context.phase === 'phase-production-server')
        await verifyBuild(root, context.nextVersion, options);
      return modified;
    },
    /** @param {import('./types.js').BuildContext} context */
    async onBuildComplete(context) {
      const root = await buildDirectory(
        context.projectDir,
        relative(context.projectDir, context.distDir),
      );
      if ((await realpath(root)) !== (await realpath(context.distDir)))
        throw new Error('Build directory mismatch');
      const marker = join(root, manifestName);
      await rm(marker, { force: true });
      try {
        const manifest = await buildPolicies(context, options);
        await options.providerAdapter?.onBuildComplete(context);
        // Providers may package assets but must not change the authorized native document bytes.
        for (const [file, expected] of Object.entries(manifest.files)) {
          const identity = await artifactIdentity(root, join(root, file));
          if (identity.hash !== expected)
            throw new Error(`Provider changed authorized output: ${file}`);
        }
        await writeAtomic(marker, JSON.stringify(manifest, null, 2));
      } catch (error) {
        await rm(marker, { force: true });
        throw error;
      }
    },
  };
}
