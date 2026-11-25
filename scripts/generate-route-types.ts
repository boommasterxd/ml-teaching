import { execFileSync } from 'node:child_process';
import { copyFileSync, globSync, mkdtempDisposableSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
using project = mkdtempDisposableSync(join(tmpdir(), 'ml-teaching-typecheck-'));

// Next.js generates next-env.d.ts in its project root, independently of distDir.
for (const name of ['next.config.mjs', 'package.json']) {
  copyFileSync(join(root, name), join(project.path, name));
}
for (const name of ['csp', 'node_modules', 'src']) {
  symlinkSync(join(root, name), join(project.path, name), 'junction');
}

const configPath = join(project.path, 'tsconfig.build.json');
const config = { extends: join(root, 'tsconfig.typecheck.json') };
writeFileSync(configPath, JSON.stringify(config));

const options = { cwd: project.path, stdio: 'inherit' } as const;
const nextCli = fileURLToPath(import.meta.resolve('next/dist/bin/next'));
execFileSync(process.execPath, [nextCli, 'typegen', project.path], options);

const types = globSync('.next/types/**/*.ts', { cwd: project.path });
const files = [...new Set(['next-env.d.ts', '.next/types/validator.ts', ...types])];
writeFileSync(configPath, JSON.stringify({ ...config, files }));

const tsc = fileURLToPath(import.meta.resolve('typescript/bin/tsc'));
execFileSync(process.execPath, [tsc, '--project', configPath], options);
