import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, expect } from '@playwright/test';

type Message = {
  id?: number;
  method?: string;
  sessionId?: string;
  result?: unknown;
  error?: { message: string };
  params?: {
    key?: { url: string };
    status?: string;
    prerenderStatus?: string;
    sessionId?: string;
    targetInfo?: { type: string; subtype?: string };
  };
};

function connect(socket: WebSocket) {
  let id = 0;
  const pending = new Map<number, PromiseWithResolvers<unknown>>();
  const targets: string[] = [];
  const prerenders = new Map<string, string>();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(String(data)) as Message;
    if (message.id !== undefined) {
      const request = pending.get(message.id);
      if (message.error) request?.reject(new Error(message.error.message));
      else request?.resolve(message.result);
      return;
    }
    const params = message.params;
    if (message.method === 'Target.attachedToTarget' && params?.sessionId) {
      if (params.targetInfo?.type === 'page') targets.push(params.sessionId);
    }
    if (message.method === 'Preload.prerenderStatusUpdated' && params?.key && params.status) {
      prerenders.set(params.key.url, params.prerenderStatus ?? params.status);
    }
  };

  async function send<Result>(method: string, params = {}, sessionId?: string): Promise<Result> {
    const requestId = ++id;
    const reply = Promise.withResolvers<unknown>();
    const timer = setTimeout(() => reply.reject(new Error(`Chromium timed out: ${method}`)), 5_000);
    pending.set(requestId, reply);
    try {
      socket.send(JSON.stringify({ id: requestId, method, params, sessionId }));
      return (await reply.promise) as Result;
    } finally {
      clearTimeout(timer);
      pending.delete(requestId);
    }
  }

  return { send, targets, prerenders };
}

async function evaluate<Result>(
  protocol: ReturnType<typeof connect>,
  session: string,
  expression: string,
) {
  const { result, exceptionDetails } = await protocol.send<{
    result: { value?: Result };
    exceptionDetails?: { text: string };
  }>('Runtime.evaluate', { expression, returnByValue: true }, session);
  if (exceptionDetails) throw new Error(exceptionDetails.text);
  return result.value;
}

async function findRecoveryLink(protocol: ReturnType<typeof connect>, session: string) {
  let point: { x: number; y: number } | undefined;
  await expect
    .poll(async () => {
      point = await evaluate(
        protocol,
        session,
        `(() => {
        const link = document.querySelector('main a[href="/"]');
        if (!link || !document.querySelector('#error-glass-art')?.hasAttribute('data-enhanced')) return;
        const { x, y, width, height } = link.getBoundingClientRect();
        const center = { x: Math.round(x + width / 2), y: Math.round(y + height / 2) };
        if (link.contains(document.elementFromPoint(center.x, center.y))) return center;
      })()`,
      );
      return point;
    })
    .toBeDefined();
  return point!;
}

async function activateHomepage(protocol: ReturnType<typeof connect>, origin: string) {
  const { targetId } = await protocol.send<{ targetId: string }>('Target.createTarget', {
    url: 'about:blank',
    forTab: true,
  });
  // A page-target session without tab support disables Chromium prerendering.
  const { sessionId: tab } = await protocol.send<{ sessionId: string }>('Target.attachToTarget', {
    targetId,
    flatten: true,
  });
  await protocol.send(
    'Target.setAutoAttach',
    {
      autoAttach: true,
      waitForDebuggerOnStart: false,
      flatten: true,
      filter: [{ type: 'page' }, { exclude: true }],
    },
    tab,
  );
  await expect.poll(() => protocol.targets[0]).toBeDefined();
  const page = protocol.targets[0];
  await protocol.send('Preload.enable', {}, page);
  await protocol.send('Page.navigate', { url: `${origin}/500` }, page);
  const point = await findRecoveryLink(protocol, page);
  expect(protocol.prerenders.has(`${origin}/`)).toBe(false);
  await protocol.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point }, page);
  await expect.poll(() => protocol.prerenders.get(`${origin}/`)).toBe('Ready');
  expect(await evaluate(protocol, page, 'location.pathname')).toBe('/500');
  for (const type of ['mousePressed', 'mouseReleased']) {
    await protocol.send(
      'Input.dispatchMouseEvent',
      { type, button: 'left', clickCount: 1, ...point },
      page,
    );
  }
  await expect
    .poll(async () => {
      for (const target of protocol.targets.toReversed()) {
        try {
          const activation = await evaluate<number>(
            protocol,
            target,
            `
          location.pathname === '/' && performance.getEntriesByType('navigation')[0]?.activationStart
        `,
          );
          if (activation && activation > 0) return activation;
        } catch (error) {
          // The old page session can detach when Chromium switches documents.
          if (!/session|target|context/i.test(String(error))) throw error;
        }
      }
      return 0;
    })
    .toBeGreaterThan(0);
}

export async function expectNativeRecoveryPrerender(baseURL: string) {
  const profile = await mkdtemp(join(tmpdir(), 'ml-teaching-prerender-'));
  const browser = spawn(
    chromium.executablePath(),
    [
      '--headless=new',
      '--no-sandbox',
      '--remote-debugging-port=0',
      '--enable-unsafe-swiftshader',
      '--no-first-run',
      '--disable-background-networking',
      '--window-size=1280,900',
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  const stopped = once(browser, 'exit');
  void stopped.catch(() => {});
  let socket: WebSocket | undefined;
  let protocol: ReturnType<typeof connect> | undefined;
  try {
    let address: string | undefined;
    await expect
      .poll(async () => {
        const endpoint = await readFile(join(profile, 'DevToolsActivePort'), 'utf8').catch(
          () => '',
        );
        const [port, path] = endpoint.trim().split('\n');
        if (port && path) address = `ws://127.0.0.1:${port}${path}`;
        return address;
      })
      .toBeDefined();
    socket = new WebSocket(address!);
    await once(socket, 'open', { signal: AbortSignal.timeout(5_000) });
    protocol = connect(socket);
    await activateHomepage(protocol, new URL(baseURL).origin);
  } finally {
    try {
      if (protocol) await protocol.send('Browser.close');
    } finally {
      socket?.close();
      if (browser.exitCode === null) browser.kill();
      await stopped.catch(() => {});
      await rm(profile, { recursive: true, force: true, maxRetries: 5 });
    }
  }
}
