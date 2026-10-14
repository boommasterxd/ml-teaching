// @vitest-environment node
import { spawn } from 'node:child_process';
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
  const exited = new Promise<void>(resolve => child.once('exit', () => resolve()));
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server startup timed out')), 10_000);
      child.stdout.on('data', chunk => {
        if (String(chunk).includes('Server running')) {
          clearTimeout(timeout);
          resolve();
        }
      });
      child.once('error', error => { clearTimeout(timeout); reject(error); });
      child.once('exit', () => { clearTimeout(timeout); reject(new Error('Server exited before startup')); });
    });
    const response = await fetch(`http://127.0.0.1:${port}/lernen`);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(html);
    expect(response.headers.get('cache-control')).toContain('no-store');
    const hidden = await fetch(`http://127.0.0.1:${port}/.secret`);
    expect(await hidden.text()).not.toContain('PRIVATE_FIXTURE');
  } finally {
    child.kill('SIGTERM');
    await exited;
    await rm(fixture, { recursive: true, force: true });
  }
}, 15_000);
