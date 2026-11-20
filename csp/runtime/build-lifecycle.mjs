import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { buildDirectory, manifestName, verifyBuild } from './artifacts.mjs';

/** Invalidate success before native Next.js can skip or ignore an adapter hook.
 * @param {string} projectDir @param {string} distDir
 */
export async function prepareBuild(projectDir, distDir) {
  const root = await buildDirectory(projectDir, distDir);
  await rm(join(root, manifestName), { force: true });
}

/** Require a fresh, matching adapter result after the single native build.
 * @param {string} projectDir @param {string} distDir @param {string} nextVersion
 * @param {import('./types.js').Options} options
 */
export async function verifyBuildOutput(projectDir, distDir, nextVersion, options) {
  return verifyBuild(await buildDirectory(projectDir, distDir), nextVersion, options);
}
