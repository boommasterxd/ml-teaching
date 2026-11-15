import { createRequire } from 'node:module';
import { join } from 'node:path';
import process from 'node:process';
import { prepareBuild, verifyBuildOutput } from './runtime/build-lifecycle.mjs';
import options from '../csp.config.mjs';

const [phase, distDir = '.next'] = process.argv.slice(2);
const projectDir = process.cwd();
if (phase === 'prepare') {
  await prepareBuild(projectDir, distDir);
} else if (phase === 'verify') {
  const require = createRequire(join(projectDir, 'package.json'));
  await verifyBuildOutput(projectDir, distDir, require('next/package.json').version, options);
} else {
  throw new Error('Usage: node csp/check-build.mjs prepare|verify [distDir]');
}
