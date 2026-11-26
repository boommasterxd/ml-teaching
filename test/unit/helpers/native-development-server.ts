import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempDisposableSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const next = createRequire(import.meta.url).resolve('next/dist/bin/next');
const projectInputs = [
  'csp',
  'csp.config.mjs',
  'next.config.mjs',
  'package.json',
  'postcss.config.mjs',
  'public',
  'src',
  'tsconfig.json',
];

function waitForLocalOrigin(child: ChildProcess) {
  return new Promise<string>((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => fail('Native Next development server did not start'), 15_000);
    function cleanup() {
      clearTimeout(timer);
      child.off('error', fail);
      child.off('exit', exited);
    }
    function fail(message: string | Error) {
      cleanup();
      reject(new Error(`${message}\n${output}`));
    }
    function exited(code: number | null, signal: NodeJS.Signals | null) {
      fail(`Native Next development server exited (${code ?? signal})`);
    }

    child.once('error', fail);
    child.once('exit', exited);
    child.stdout?.on('data', (chunk: Buffer) => {
      output = (output + chunk.toString()).slice(-4096);
      const url = output.match(/Local:\s+(http:\/\/127\.0\.0\.1:[1-9]\d{0,4})\b/)?.[1];
      if (!url) return;
      cleanup();
      resolve(url);
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      output = (output + chunk.toString()).slice(-4096);
    });
  });
}

function killProcessTree(pid: number) {
  if (process.platform === 'win32') {
    const systemRoot = process.env.SystemRoot;
    if (!systemRoot) throw new Error('Windows SystemRoot is unavailable');
    execFileSync(join(systemRoot, 'System32', 'taskkill.exe'), ['/pid', String(pid), '/t', '/f'], {
      stdio: 'ignore',
      timeout: 1000,
    });
    return;
  }
  try {
    process.kill(-pid, 'SIGKILL');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
  }
}

async function stopServer(child: ChildProcess, closed: Promise<boolean>) {
  if (!child.pid) return;
  if (process.platform !== 'win32') child.kill('SIGTERM');
  if (await Promise.race([closed, delay(1000, false, { ref: false })])) return;
  killProcessTree(child.pid);
  if (!(await Promise.race([closed, delay(1000, false, { ref: false })]))) {
    throw new Error('Native Next development server did not stop');
  }
}

export async function withNativeDevelopmentServer(check: (origin: string) => Promise<void>) {
  // Stay under the project lockfile so Turbopack resolves the installed packages in its root.
  const temporaryRoot = join(root, 'out');
  mkdirSync(temporaryRoot, { recursive: true });
  using project = mkdtempDisposableSync(join(temporaryRoot, 'native-dev-'));
  for (const name of projectInputs) {
    cpSync(join(root, name), join(project.path, name), { recursive: true });
  }

  const child = spawn(process.execPath, [next, 'dev', '--hostname', '127.0.0.1', '--port', '0'], {
    cwd: project.path,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      PATH: process.env.PATH,
      SystemRoot: process.env.SystemRoot,
      NODE_ENV: 'development',
      NEXT_TELEMETRY_DISABLED: '1',
      CI: 'true',
    },
  });
  const closed = new Promise<boolean>((resolve) => child.once('close', () => resolve(true)));
  try {
    await check(await waitForLocalOrigin(child));
  } finally {
    await stopServer(child, closed);
  }
}
