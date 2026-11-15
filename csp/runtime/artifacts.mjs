import { readFile, writeFile, rename, realpath, rm } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { digest } from './html.mjs';
import { browserMaxAge } from './browser-cache.mjs';

export const manifestName = 'hash-csp-manifest.json';

/** Reject symlinks escaping the build, including artifacts from another application.
 * @param {string} root @param {string} file
 */
export async function containedFile(root, file) {
  const canonicalRoot = await realpath(root);
  const canonicalFile = await realpath(file);
  if (!canonicalFile.startsWith(canonicalRoot + sep))
    throw new Error(`Artifact escapes build directory: ${file}`);
  return canonicalFile;
}

/** @param {string} root @param {string} file */
export async function readArtifact(root, file) {
  return readFile(await containedFile(root, file), 'utf8');
}

/** Replace a file rather than mutating hardlinked native adapter assets.
 * @param {string} file @param {string} content
 */
export async function writeAtomic(file, content) {
  const temporary = `${file}.hash-csp-tmp`;
  await writeFile(temporary, content, { flag: 'wx' });
  try {
    await rename(temporary, file);
  } finally {
    await rm(temporary, { force: true });
  }
}

/** @param {string} root @param {string} file @param {string} content */
export async function replaceArtifact(root, file, content) {
  await writeAtomic(await containedFile(root, file), content);
}

/** @param {string} root @param {string} file */
export async function readJson(root, file) {
  return JSON.parse(await readArtifact(root, file));
}

/** @param {import('./types.js').Options} options */
export function optionsDigest(options) {
  return digest(
    JSON.stringify({
      routes: options.routes,
      errorRoutes: options.errorRoutes ?? [],
      policies: options.policies,
      browserMaxAgeSeconds: browserMaxAge(options),
    }),
  );
}

/** Native next start invokes the adapter's modifyConfig hook. No second build or Header Proxy.
 * @param {string} root @param {string} nextVersion @param {import('./types.js').Options} options
 */
export async function verifyBuild(root, nextVersion, options) {
  /** @type {import('./types.js').Manifest} */
  const manifest = await readJson(root, join(root, manifestName));
  const buildId = (await readArtifact(root, join(root, 'BUILD_ID'))).trim();
  if (
    manifest.version !== 1 ||
    manifest.buildId !== buildId ||
    manifest.nextVersion !== nextVersion ||
    manifest.optionsDigest !== optionsDigest(options) ||
    !Object.keys(manifest.files).length
  ) {
    throw new Error('Stale or incompatible hash CSP manifest; run the native build again');
  }
  for (const [file, expected] of Object.entries(manifest.files)) {
    if (digest(await readArtifact(root, resolve(root, file))) !== expected) {
      throw new Error(`Hash CSP artifact changed after build: ${file}`);
    }
  }
  return manifest;
}

/** @param {string} root @param {string} file */
export async function artifactIdentity(root, file) {
  const canonicalFile = await containedFile(root, file);
  return {
    file: relative(await realpath(root), canonicalFile),
    hash: digest(await readFile(canonicalFile)),
  };
}

/** @param {string} projectDir @param {string} distDir */
export async function buildDirectory(projectDir, distDir) {
  const candidate = resolve(projectDir, distDir);
  const root = await realpath(projectDir);
  if (!candidate.startsWith(resolve(projectDir) + sep)) {
    throw new Error('Hash CSP requires a distDir inside this project');
  }
  let ancestor = candidate;
  while (true) {
    try {
      const canonical = await realpath(ancestor);
      if (canonical !== root && !canonical.startsWith(root + sep)) {
        throw new Error('Hash CSP requires a distDir inside this project');
      }
      break;
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
      ancestor = dirname(ancestor);
    }
  }
  return candidate;
}
