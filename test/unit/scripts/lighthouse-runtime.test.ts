import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { resolveLighthouse } from '../../../scripts/lighthouse-runtime.ts';

const fixtures: string[] = [];
afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function packageFixture(
  root: string,
  version: string,
  options: { cliVersion?: string; engine?: string } = {},
) {
  await mkdir(join(root, 'cli'), { recursive: true });
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({
      name: 'lighthouse',
      type: 'module',
      version,
      engines: { node: options.engine ?? '>=22.19' },
    }),
  );
  await writeFile(
    join(root, 'cli/index.js'),
    `console.log(${JSON.stringify(options.cliVersion ?? version)});`,
  );
}

async function resolverFixture({
  globalVersion,
  localVersion,
  lockVersion,
  latest = '13.6.0',
  cliVersion,
  engine,
}: {
  globalVersion?: string;
  localVersion?: string;
  lockVersion?: string;
  latest?: string;
  cliVersion?: string;
  engine?: string;
} = {}) {
  const root = await mkdtemp(join(tmpdir(), 'ml-teaching-lighthouse-'));
  fixtures.push(root);
  const globalRoot = join(root, 'global');
  const npmCli = join(root, 'npm.cjs');
  const registry =
    globalVersion || lockVersion
      ? "throw new Error('A global or locked install must not query the registry');"
      : `console.log(${JSON.stringify(JSON.stringify(latest))});`;
  await writeFile(
    npmCli,
    `const args = process.argv.slice(2);
    if (args[0] === 'root') console.log(${JSON.stringify(globalRoot)});
    else if (args[0] === 'view') { ${registry} }
    else process.exit(1);`,
  );
  if (lockVersion) {
    await writeFile(
      join(root, 'package-lock.json'),
      JSON.stringify({
        packages: { 'node_modules/lighthouse': { version: lockVersion } },
      }),
    );
  }
  if (globalVersion)
    await packageFixture(join(globalRoot, 'lighthouse'), globalVersion, { cliVersion, engine });
  if (localVersion)
    await packageFixture(join(root, 'node_modules/lighthouse'), localVersion, {
      cliVersion,
      engine,
    });
  return { projectRoot: root, npmCommand: [process.execPath, npmCli] as const };
}

describe('Lighthouse runtime selection', () => {
  it('uses and executes the active global native CLI before a different local copy', async () => {
    const options = await resolverFixture({ globalVersion: '13.6.0', localVersion: '12.0.0' });
    const runtime = await resolveLighthouse({ ...options, lockedFallback: true });
    expect(runtime.source).toBe('global');
    expect(runtime.version).toBe('13.6.0');
    expect(runtime.cli).toBe(join(options.projectRoot, 'global/lighthouse/cli/index.js'));
  });

  it('reuses the exact latest stable local copy only when global is absent', async () => {
    const options = await resolverFixture({ localVersion: '13.6.0' });
    expect(await resolveLighthouse(options)).toMatchObject({ source: 'local', version: '13.6.0' });
    const stale = await resolverFixture({ localVersion: '12.0.0' });
    await expect(resolveLighthouse(stale)).rejects.toThrow('differs from latest stable');
    await expect(resolveLighthouse(await resolverFixture())).rejects.toThrow('missing');
  });

  it('checks the local CLI against the lock without consulting the registry', async () => {
    const options = await resolverFixture({ localVersion: '13.6.0', lockVersion: '13.6.0' });
    await expect(resolveLighthouse({ ...options, lockedFallback: true })).resolves.toMatchObject({
      source: 'local',
      version: '13.6.0',
    });
    const stale = await resolverFixture({ localVersion: '12.0.0', lockVersion: '13.6.0' });
    await expect(resolveLighthouse({ ...stale, lockedFallback: true })).rejects.toThrow(
      'differs from the lockfile version 13.6.0',
    );
  });

  it('rejects package/CLI mismatch without silently using the available local copy', async () => {
    const options = await resolverFixture({
      globalVersion: '13.6.0',
      localVersion: '13.6.0',
      cliVersion: '12.0.0',
    });
    await expect(resolveLighthouse(options)).rejects.toThrow('package and CLI versions differ');
  });

  it('rejects incompatible and unsupported runtime requirements before measuring', async () => {
    const options = await resolverFixture({ globalVersion: '13.6.0' });
    await expect(resolveLighthouse({ ...options, nodeVersion: '22.18.0' })).rejects.toThrow(
      'requires Node',
    );
    const unsupported = await resolverFixture({ globalVersion: '13.6.0', engine: '^22' });
    await expect(resolveLighthouse(unsupported)).rejects.toThrow(
      'Unsupported Lighthouse Node engine',
    );
  });
});
