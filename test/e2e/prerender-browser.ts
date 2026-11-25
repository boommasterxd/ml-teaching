import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { learningPaths } from '../../src/lib/learning-paths';

type Destination = '/' | typeof learningPaths.imagePractice;

const trainingCameraProbe = `(() => {
  if (window.recoveryCameraRequests !== undefined) return;
  window.recoveryCameraProbeEarly =
    document.readyState === 'loading' && !document.querySelector('script[src]');
  window.recoveryCameraRequests = 0;
  const observed = new WeakSet();
  const probe = () => {
    window.recoveryCameraRequests += 1;
    return Promise.reject(new DOMException('Test camera is disabled', 'NotAllowedError'));
  };
  // The secure-context media API may appear after Chromium creates the document.
  Object.defineProperty(navigator, 'mediaDevices', {
    get() {
      const devices = Reflect.get(Object.getPrototypeOf(navigator), 'mediaDevices', navigator);
      if (devices && !observed.has(devices)) {
        Object.defineProperty(devices, 'getUserMedia', { value: probe });
        observed.add(devices);
      }
      return devices;
    },
  });
})()`;

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
    waitingForDebugger?: boolean;
    request?: { url: string };
  };
};

function connect(socket: WebSocket, observedOrigin?: string) {
  let id = 0;
  const pending = new Map<number, PromiseWithResolvers<unknown>>();
  const targets = new Map<string, { prerender: boolean; prepared: Promise<void> }>();
  const prerenders = new Map<string, string>();
  const externalOrigins = new Set<string>();
  const scriptSessions = new Set<string>();

  async function prepareTarget(sessionId: string, waiting: boolean) {
    const probes = observedOrigin
      ? [
          send('Page.enable', {}, sessionId),
          send('Runtime.enable', {}, sessionId),
          send(
            'Page.addScriptToEvaluateOnNewDocument',
            { source: trainingCameraProbe, runImmediately: true },
            sessionId,
          ),
          send('Network.enable', { maxPostDataSize: 0 }, sessionId),
        ]
      : [];
    // The prerender target can queue probe commands until the debugger releases it.
    if (waiting) probes.push(send('Runtime.runIfWaitingForDebugger', {}, sessionId));
    await Promise.all(probes);
  }

  function attachPage(params: Message['params']) {
    if (!params?.sessionId || params.targetInfo?.type !== 'page') return;
    const prepared = prepareTarget(params.sessionId, params.waitingForDebugger ?? false);
    void prepared.catch(() => {});
    targets.set(params.sessionId, {
      prerender: params.targetInfo.subtype === 'prerender',
      prepared,
    });
  }

  function observeRequest(rawUrl: string, sessionId: string | undefined) {
    if (!observedOrigin) return;
    const url = new URL(rawUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return;
    if (url.origin !== observedOrigin) {
      externalOrigins.add(url.origin);
      return;
    }
    if (sessionId && url.pathname.startsWith('/_next/static/') && url.pathname.endsWith('.js'))
      scriptSessions.add(sessionId);
  }

  socket.onmessage = ({ data }) => {
    const message = JSON.parse(String(data)) as Message;
    if (message.id !== undefined) {
      const request = pending.get(message.id);
      if (message.error) request?.reject(new Error(message.error.message));
      else request?.resolve(message.result);
      return;
    }
    const params = message.params;
    if (message.method === 'Target.attachedToTarget') attachPage(params);
    if (message.method === 'Preload.prerenderStatusUpdated' && params?.key && params.status) {
      prerenders.set(params.key.url, params.prerenderStatus ?? params.status);
    }
    if (message.method === 'Network.requestWillBeSent' && params?.request)
      observeRequest(params.request.url, message.sessionId);
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

  return { send, targets, prerenders, externalOrigins, scriptSessions };
}

type Protocol = ReturnType<typeof connect>;
type Point = { x: number; y: number };

async function evaluate<Result>(protocol: Protocol, session: string, expression: string) {
  const { result, exceptionDetails } = await protocol.send<{
    result: { value?: Result };
    exceptionDetails?: { text: string };
  }>('Runtime.evaluate', { expression, returnByValue: true }, session);
  if (exceptionDetails) throw new Error(exceptionDetails.text);
  return result.value;
}

async function findVisibleCenter(protocol: Protocol, session: string, elementExpression: string) {
  let point: Point | undefined;
  await expect
    .poll(async () => {
      point = await evaluate(
        protocol,
        session,
        `(() => {
        const element = ${elementExpression};
        if (!element) return;
        const { x, y, width, height } = element.getBoundingClientRect();
        const center = { x: Math.round(x + width / 2), y: Math.round(y + height / 2) };
        if (element.contains(document.elementFromPoint(center.x, center.y))) return center;
      })()`,
      );
      return point;
    })
    .toBeDefined();
  return point!;
}

async function recoveryLink(protocol: Protocol, page: string, destination: Destination) {
  if (destination === '/')
    return findVisibleCenter(
      protocol,
      page,
      `document.querySelector('#error-glass-art[data-enhanced]') && document.querySelector('main a[href="/"]')`,
    );
  const menu = await findVisibleCenter(
    protocol,
    page,
    `[...document.querySelectorAll('nav button')].find((button) => button.textContent.trim() === 'Lernlabor')`,
  );
  await protocol.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...menu }, page);
  const selector = JSON.stringify(`nav a[href="${destination}"]`);
  return findVisibleCenter(protocol, page, `document.querySelector(${selector})`);
}

async function openRecoveryTab(protocol: Protocol, origin: string, watchTraining: boolean) {
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
      waitForDebuggerOnStart: watchTraining,
      flatten: true,
      filter: [{ type: 'page' }, { exclude: true }],
    },
    tab,
  );
  await expect.poll(() => protocol.targets.size).toBe(1);
  const [page, target] = [...protocol.targets][0];
  await target.prepared;
  await protocol.send('Preload.enable', {}, page);
  await protocol.send('Page.navigate', { url: `${origin}/500` }, page);
  return page;
}

type NavigationState = { path: string; activationStart?: number };

async function readTarget<Result>(protocol: Protocol, target: string, expression: string) {
  try {
    return await evaluate<Result>(protocol, target, expression);
  } catch (error) {
    // The old page session can detach when Chromium switches documents.
    if (!/session|target|context/i.test(String(error))) throw error;
  }
}

async function activeDestination(protocol: Protocol, destination: Destination) {
  let active: string | undefined;
  await expect
    .poll(async () => {
      for (const session of [...protocol.targets.keys()].reverse()) {
        const state = await readTarget<NavigationState>(
          protocol,
          session,
          `({ path: location.pathname, activationStart: performance.getEntriesByType('navigation')[0]?.activationStart })`,
        );
        if (state?.path === destination && (state.activationStart ?? 0) > 0) {
          active = session;
          return active;
        }
      }
    })
    .toBeDefined();
  return active!;
}

async function expectTrainingConsent(protocol: Protocol, target: string, prerendering: boolean) {
  await expect
    .poll(() =>
      readTarget(
        protocol,
        target,
        `(() => {
          const title = document.getElementById('consent-modal-title');
          const dialog = title?.closest('dialog[open]');
          const submit = [...(dialog?.querySelectorAll('button') ?? [])]
            .find((button) => button.textContent.trim() === 'Zustimmen');
          const choices = [...(dialog?.querySelectorAll('[role="checkbox"], input[type="checkbox"]') ?? [])]
            .filter((choice) => choice.getClientRects().length && getComputedStyle(choice).visibility === 'visible');
          return {
            prerendering: document.prerendering,
            consent: title?.textContent.trim(),
            submitDisabled: submit?.disabled || submit?.getAttribute('aria-disabled') === 'true',
            checked: choices.map((choice) => choice.getAttribute('aria-checked') ?? String(choice.checked)),
            cameraRequests: window.recoveryCameraRequests,
            cameraProbeEarly: window.recoveryCameraProbeEarly,
            mediaProbeReady: Object.hasOwn(navigator, 'mediaDevices') &&
              Object.hasOwn(navigator.mediaDevices ?? {}, 'getUserMedia'),
          };
        })()`,
      ),
    )
    .toEqual({
      prerendering,
      consent: 'Einwilligung zur Datenverarbeitung',
      submitDisabled: true,
      checked: ['false', 'false', 'false'],
      cameraRequests: 0,
      cameraProbeEarly: true,
      mediaProbeReady: true,
    });
  expect([...protocol.externalOrigins]).toEqual([]);
}

async function activateRecoveryDestination(
  protocol: Protocol,
  origin: string,
  destination: Destination,
) {
  const training = destination === learningPaths.imagePractice;
  const page = await openRecoveryTab(protocol, origin, training);
  const point = await recoveryLink(protocol, page, destination);
  expect(protocol.prerenders.has(`${origin}${destination}`)).toBe(false);
  await protocol.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point }, page);
  await expect.poll(() => protocol.prerenders.get(`${origin}${destination}`)).toBe('Ready');
  expect(await evaluate(protocol, page, 'location.pathname')).toBe('/500');

  if (training) {
    const prerender = [...protocol.targets].find(([, target]) => target.prerender);
    if (!prerender) throw new Error('Missing prerendered training document.');
    const [session, target] = prerender;
    await target.prepared;
    await expectTrainingConsent(protocol, session, true);
    expect(protocol.scriptSessions.has(session)).toBe(true);
  }
  for (const type of ['mousePressed', 'mouseReleased']) {
    await protocol.send(
      'Input.dispatchMouseEvent',
      { type, button: 'left', clickCount: 1, ...point },
      page,
    );
  }
  const active = await activeDestination(protocol, destination);
  if (training) await expectTrainingConsent(protocol, active, false);
}

export async function expectNativeRecoveryPrerender(
  baseURL: string,
  destination: Destination = '/',
) {
  const { origin, hostname } = new URL(baseURL);
  if (hostname !== '127.0.0.1')
    throw new Error('Recovery browser requires the local production URL.');
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
      '--no-proxy-server',
      '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
      '--use-fake-device-for-media-stream',
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
    protocol = connect(socket, destination === '/' ? undefined : origin);
    await activateRecoveryDestination(protocol, origin, destination);
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
