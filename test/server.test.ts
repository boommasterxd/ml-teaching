// @vitest-environment node
import { spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

async function availablePort(): Promise<number> {
  const listener = createServer();
  await new Promise<void>(resolve => listener.listen(0, '127.0.0.1', resolve));
  const address = listener.address();
  if (!address || typeof address === 'string') throw new Error('Missing TCP port');
  await new Promise<void>((resolve, reject) => listener.close(error => error ? reject(error) : resolve()));
  return address.port;
}

function waitForStartup(child: ChildProcessWithoutNullStreams): Promise<void> {
  return new Promise((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timeout);
      child.stdout.off('data', onData);
      child.off('error', onError);
      child.off('exit', onExit);
      error ? reject(error) : resolve();
    };
    const onData = (chunk: Buffer) => {
      if (String(chunk).includes('Server running')) finish();
    };
    const onError = (error: Error) => finish(error);
    const onExit = () => finish(new Error('Server exited before startup'));
    const timeout = setTimeout(() => finish(new Error('Server startup timed out')), 10_000);
    child.stdout.on('data', onData);
    child.once('error', onError);
    child.once('exit', onExit);
  });
}

function stopServer(child: ChildProcessWithoutNullStreams): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(escalation);
      clearTimeout(deadline);
      child.off('exit', onExit);
      error ? reject(error) : resolve();
    };
    const onExit = () => finish();
    const escalation = setTimeout(() => child.kill('SIGKILL'), 2_000);
    const deadline = setTimeout(() => finish(new Error('Server shutdown timed out')), 5_000);
    child.once('exit', onExit);
    child.kill('SIGTERM');
  });
}

test('serves SPA routes from a hidden deployment directory without exposing hidden files', async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'teachable-server-'));
  const root = path.join(fixture, '.deployment');
  const dist = path.join(root, 'dist');
  await mkdir(dist, { recursive: true });
  const html = '<!doctype html><title>SPA fixture</title><main>SPA fallback</main>';
  await writeFile(path.join(dist, 'index.html'), html);
  await writeFile(path.join(dist, '.secret'), 'PRIVATE_FIXTURE');
  const port = await availablePort();
  const child = spawn(process.execPath, [
    fileURLToPath(new URL('../node_modules/tsx/dist/cli.mjs', import.meta.url)),
    fileURLToPath(new URL('../server.ts', import.meta.url)),
  ], { cwd: root, env: { ...process.env, NODE_ENV: 'production', PORT: String(port) } });
  try {
    await waitForStartup(child);
    const response = await fetch(`http://127.0.0.1:${port}/lernen`);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(html);
    expect(response.headers.get('cache-control')).toContain('no-store');
    const hidden = await fetch(`http://127.0.0.1:${port}/.secret`);
    expect(await hidden.text()).not.toContain('PRIVATE_FIXTURE');
  } finally {
    try {
      await stopServer(child);
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  }
}, 15_000);
