import { execFile } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
type Command = readonly [string, ...string[]];
const stableVersion = /^\d+\.\d+\.\d+$/;

async function run(command: Command, args: string[]) {
  const [executable, ...prefix] = command;
  const { stdout } = await execute(executable, [...prefix, ...args], {
    encoding: 'utf8',
    timeout: 30_000,
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim();
}

/** npm scripts expose the active npm CLI; direct Node invocation uses the active PATH. */
async function activeNpm(): Promise<Command> {
  const cli = process.env.npm_execpath;
  if (cli && isAbsolute(cli) && cli.endsWith('/bin/npm-cli.js')) {
    const metadata = JSON.parse(await readFile(resolve(cli, '../../package.json'), 'utf8'));
    if (metadata.name === 'npm') return [process.execPath, cli];
  }
  return ['npm'];
}

async function exists(path: string) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false;
    throw error;
  }
}

/** Fail closed on engine syntax outside Lighthouse's supported minimum-version contract. */
function assertNodeEngine(range: unknown, nodeVersion: string) {
  const minimum = typeof range === 'string' && /^>=(\d+)\.(\d+)(?:\.(\d+))?$/.exec(range);
  if (!minimum) throw new Error(`Unsupported Lighthouse Node engine range: ${String(range)}`);
  const required = minimum.slice(1).map((part) => Number(part ?? 0));
  const actual = nodeVersion.split('.').map(Number);
  for (let index = 0; index < required.length; index++) {
    if (actual[index] > required[index]) return;
    if (actual[index] < required[index])
      throw new Error(`Lighthouse requires Node ${range}; current runtime is ${nodeVersion}.`);
  }
}

interface ResolveOptions {
  projectRoot?: string;
  npmCommand?: Command;
  nodeVersion?: string;
}

/** Resolve once per run; a broken global installation never silently falls back. */
export async function resolveLighthouse({
  projectRoot = process.cwd(),
  npmCommand,
  nodeVersion = process.versions.node,
}: ResolveOptions = {}) {
  const npm = npmCommand ?? (await activeNpm());
  const globalRoot = await run(npm, ['root', '--global']);
  if (!isAbsolute(globalRoot)) throw new Error('npm returned a nonabsolute global package root.');
  let packageRoot = join(globalRoot, 'lighthouse');
  let source = 'global';
  let latest: string | undefined;
  if (!(await exists(packageRoot))) {
    latest = JSON.parse(await run(npm, ['view', 'lighthouse@latest', 'version', '--json']));
    if (!latest || !stableVersion.test(latest))
      throw new Error('The registry did not return a stable Lighthouse version.');
    source = 'local';
    packageRoot = join(projectRoot, 'node_modules/lighthouse');
    if (!(await exists(packageRoot)))
      throw new Error(
        `Lighthouse ${latest} is missing. Prepare an authorized local fallback first.`,
      );
  }
  const metadata = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
  if (metadata.name !== 'lighthouse' || !stableVersion.test(metadata.version))
    throw new Error('Invalid Lighthouse package identity.');
  if (latest && metadata.version !== latest)
    throw new Error(`Local Lighthouse ${metadata.version} differs from latest stable ${latest}.`);
  assertNodeEngine(metadata.engines?.node, nodeVersion);
  const cli = join(packageRoot, 'cli/index.js');
  const cliVersion = await run([process.execPath], [cli, '--version']);
  if (cliVersion !== metadata.version)
    throw new Error('Lighthouse package and CLI versions differ.');
  return { cli, version: cliVersion, source, nodeVersion };
}
