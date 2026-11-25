import type { CDPSession, Page } from '@playwright/test';
import contract from '../unit/lib/fixtures/mobilenet-v2-embedding.json' with { type: 'json' };

const graph = new URL(contract.modelUrl);
export const modelDirectory = new URL('.', graph);
const files = new Set([
  'model.json',
  'group1-shard1of4.bin',
  'group1-shard2of4.bin',
  'group1-shard3of4.bin',
  'group1-shard4of4.bin',
]);
const kaggleOrigin = 'https://www.kaggle.com';
const kaggleDirectory = '/models/google/mobilenet-v2/tfJs/100-224-classification/2/';
const storageOrigin = 'https://storage.googleapis.com';
const storageDirectory = '/kagglesdsdata/models/2599/3646/';
const signedQueryKeys = [
  'X-Goog-Algorithm',
  'X-Goog-Credential',
  'X-Goog-Date',
  'X-Goog-Expires',
  'X-Goog-SignedHeaders',
  'X-Goog-Signature',
];
const redirectStatuses = new Set([301, 302, 303, 307, 308]);
const downloadTimeout = 25_000;
const maximumModelBytes = 24 * 1024 * 1024;

function isPlainHttps(url: URL) {
  return url.protocol === 'https:' && !url.username && !url.password && !url.hash;
}

function fileName(url: URL) {
  return url.pathname.slice(modelDirectory.pathname.length);
}

function isModelFile(url: URL) {
  return (
    isPlainHttps(url) &&
    url.origin === graph.origin &&
    url.search === graph.search &&
    url.pathname.startsWith(modelDirectory.pathname) &&
    files.has(fileName(url))
  );
}

function isKaggleFile(url: URL, file: string) {
  const query = url.searchParams;
  return (
    url.origin === kaggleOrigin &&
    url.pathname === kaggleDirectory + file &&
    query.size === 2 &&
    query.get('tfjs-format') === 'file' &&
    query.get('tfhub-redirect') === 'true'
  );
}

function isStorageFile(url: URL, file: string) {
  const query = url.searchParams;
  return (
    url.origin === storageOrigin &&
    url.pathname === storageDirectory + file &&
    query.size === signedQueryKeys.length &&
    signedQueryKeys.every((key) => query.getAll(key).length === 1 && Boolean(query.get(key)))
  );
}

type Header = { name: string; value: string };
type ModelRequest = { url: URL; file: string };

function header(headers: readonly Header[], name: string) {
  const matches = headers.filter((item) => item.name.toLowerCase() === name);
  return matches.length === 1 ? matches[0].value : undefined;
}

function isAllowedRedirect(current: ModelRequest, target: URL) {
  if (!isPlainHttps(target)) return false;
  if (current.url.origin === graph.origin) return isKaggleFile(target, current.file);
  return current.url.origin === kaggleOrigin && isStorageFile(target, current.file);
}

function modelSize(headers: readonly Header[]) {
  const length = header(headers, 'content-length');
  const encodings = headers.filter(({ name }) =>
    ['content-encoding', 'transfer-encoding'].includes(name.toLowerCase()),
  );
  if (
    !length ||
    !/^\d+$/.test(length) ||
    encodings.some(
      ({ name, value }) => name.toLowerCase() !== 'content-encoding' || value !== 'identity',
    )
  ) {
    throw new ModelTrafficError('Model response has no bounded identity-encoded body.');
  }
  const size = Number(length);
  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new ModelTrafficError('Model response has an invalid length.');
  }
  return size;
}

export function createModelRequestPolicy() {
  const started = new Set<string>();
  const active = new Map<string, ModelRequest>();
  const redirects = new Map<string, ModelRequest>();
  let modelBytes = 0;

  function allowRequest(id: string, url: URL, previous?: string) {
    const redirect = previous ? redirects.get(previous) : undefined;
    if (previous) {
      if (!redirect || redirect.url.href !== url.href) {
        throw new ModelTrafficError('Model request does not match its approved redirect.');
      }
      redirects.delete(previous);
      active.set(id, redirect);
      return { file: redirect.file, first: false };
    }

    if (!isModelFile(url))
      throw new ModelTrafficError('Model request is outside the permitted file locations.');
    const file = fileName(url);
    if (started.has(file)) throw new ModelTrafficError('Model file was already requested.');
    started.add(file);
    active.set(id, { url, file });
    return { file, first: true };
  }

  function allowResponse(id: string, status: number, headers: readonly Header[]) {
    const request = active.get(id);
    if (!request) throw new ModelTrafficError('Model response has no approved request.');
    active.delete(id);
    if (request.url.origin === storageOrigin) {
      if (status !== 200)
        throw new ModelTrafficError('Expected a successful model storage response.');
      modelBytes += modelSize(headers);
      if (modelBytes > maximumModelBytes)
        throw new ModelTrafficError('Model download exceeds its size limit.');
      return request.file;
    }

    const location = header(headers, 'location');
    const target = location && URL.parse(location, request.url);
    if (!redirectStatuses.has(status) || !target || !isAllowedRedirect(request, target)) {
      throw new ModelTrafficError('Model redirect is outside the permitted file locations.');
    }
    redirects.set(id, { url: target, file: request.file });
  }

  return { allowRequest, allowResponse };
}

function isLocalRead(url: URL, document: URL, resourceType: string) {
  if (url.origin !== document.origin) return false;
  if (resourceType === 'Document') return url.href === document.href;
  return (
    !url.search &&
    /^(?:\/_next\/static\/[\w./-]+|\/favicon\.svg|\/apple-icon\.png)$/.test(url.pathname)
  );
}

function requestCategory(url: URL, document: URL) {
  if (url.origin !== document.origin) {
    if (url.origin === graph.origin) return 'model-hub';
    if (url.origin === kaggleOrigin) return 'model-mirror';
    if (url.origin === storageOrigin) return 'model-storage';
    return 'unknown-external';
  }
  if (url.pathname === document.pathname) return 'local-training';
  if (url.pathname.startsWith('/_next/static/')) return 'local-static';
  if (url.pathname === '/_next/image') return 'local-image-optimizer';
  if (url.pathname === '/favicon.ico') return 'local-favicon-ico';
  if (url.searchParams.has('_rsc')) return 'local-route-data';
  return 'unknown-local';
}

type PausedRequest = {
  requestId: string;
  networkId?: string;
  redirectedRequestId?: string;
  resourceType: string;
  request: {
    url: string;
    method: string;
    headers: Record<string, unknown>;
    hasPostData?: boolean;
    postData?: string;
  };
  responseStatusCode?: number;
  responseErrorReason?: string;
  responseHeaders?: Header[];
};

function blockedRequest(
  url: URL,
  document: URL,
  { resourceType, networkId }: PausedRequest,
  consent: boolean | 'redirect' | 'unchecked',
) {
  const category = requestCategory(url, document);
  return new ModelTrafficError(
    `Blocked request (${category}, ${resourceType}, network=${Boolean(networkId)}, consent=${consent}).`,
  );
}

function safeRead({ method, headers, hasPostData, postData }: PausedRequest['request']) {
  return (
    method === 'GET' &&
    !hasPostData &&
    postData === undefined &&
    !Object.keys(headers).some((name) =>
      /^(?:authorization|proxy-authorization|cookie)$/i.test(name),
    )
  );
}

function trackModelTransfers(onTimeout: () => void) {
  const deadlines = new Map<string, ReturnType<typeof setTimeout>>();
  const inFlight = new Map<string, string>();
  const finishing = new Set<string>();
  const completed = new Set<string>();
  return {
    start(networkId: string, file: string, first: boolean) {
      inFlight.set(networkId, file);
      if (first) deadlines.set(file, setTimeout(onTimeout, downloadTimeout));
    },
    expectFinish(networkId: string) {
      finishing.add(networkId);
    },
    finish(networkId: string) {
      const file = inFlight.get(networkId);
      if (!file || !finishing.delete(networkId)) return;
      for (const [id, activeFile] of inFlight) {
        if (activeFile === file) inFlight.delete(id);
      }
      clearTimeout(deadlines.get(file));
      deadlines.delete(file);
      completed.add(file);
    },
    has: (networkId: string) => inFlight.has(networkId),
    completed: () => [...completed].sort(),
    clear() {
      for (const timer of deadlines.values()) clearTimeout(timer);
      deadlines.clear();
      inFlight.clear();
      finishing.clear();
    },
  };
}

async function enableBrowserInspection(session: CDPSession) {
  await session.send('Network.enable', { maxPostDataSize: 0 }, { timeout: 5_000 });
  await session.send(
    'Fetch.enable',
    { patterns: [{ urlPattern: 'http://*' }, { urlPattern: 'https://*' }] },
    { timeout: 5_000 },
  );
}

export async function observeNativeModelTraffic(
  page: Page,
  document: URL,
  hasConsent: () => Promise<boolean>,
) {
  const context = page.context();
  const session = await context.newCDPSession(page);
  const policy = createModelRequestPolicy();
  const transfers = trackModelTransfers(() => stop('Model download timed out.'));
  let failure: string | undefined;
  let closing: Promise<void> | undefined;

  function close() {
    transfers.clear();
    closing ??= context.close();
    return closing;
  }

  function stop(reason: string) {
    failure ??= reason;
    void close().catch(() => {});
  }

  async function continueRequest(event: PausedRequest) {
    const { requestId, request, redirectedRequestId, networkId } = event;
    const url = URL.parse(request.url);
    if (failure || !url || !safeRead(request))
      throw new ModelTrafficError('Unexpected request in model test.');
    if (isLocalRead(url, document, event.resourceType) && !redirectedRequestId) {
      await session.send('Fetch.continueRequest', { requestId }, { timeout: 5_000 });
      return;
    }
    const scripted = event.resourceType === 'Fetch' || event.resourceType === 'XHR';
    const consent = redirectedRequestId
      ? 'redirect'
      : scripted && networkId
        ? await hasConsent()
        : 'unchecked';
    if (!scripted || !networkId || consent === false || failure)
      throw blockedRequest(url, document, event, consent);
    const { file, first } = policy.allowRequest(requestId, url, redirectedRequestId);
    transfers.start(networkId, file, first);
    await session.send(
      'Fetch.continueRequest',
      { requestId, interceptResponse: true },
      { timeout: 5_000 },
    );
  }

  async function continueResponse(event: PausedRequest) {
    const { requestId, networkId, responseStatusCode, responseHeaders } = event;
    if (failure || !networkId || !responseStatusCode)
      throw new ModelTrafficError('Model request failed in the browser.');
    const file = policy.allowResponse(requestId, responseStatusCode, responseHeaders ?? []);
    if (file) transfers.expectFinish(networkId);
    await session.send('Fetch.continueResponse', { requestId }, { timeout: 5_000 });
  }

  session.on('Fetch.requestPaused', (event) => {
    const operation =
      event.responseStatusCode !== undefined || event.responseErrorReason !== undefined
        ? continueResponse(event)
        : continueRequest(event);
    void operation.catch(async (error: unknown) => {
      if (closing) return;
      // Protocol errors can contain signed URLs. Only report fixed policy messages.
      const reason =
        error instanceof ModelTrafficError
          ? error.message
          : 'Browser model traffic could not be verified.';
      failure ??= reason;
      await session
        .send(
          'Fetch.failRequest',
          {
            requestId: event.requestId,
            errorReason: 'BlockedByClient',
          },
          { timeout: 5_000 },
        )
        .catch(() => {});
      stop(reason);
    });
  });
  session.on('Network.loadingFinished', ({ requestId }) => transfers.finish(requestId));
  session.on('Network.loadingFailed', ({ requestId, blockedReason, corsErrorStatus }) => {
    if (closing || !transfers.has(requestId)) return;
    stop(
      corsErrorStatus
        ? 'Browser rejected model response under CORS.'
        : blockedReason === 'csp'
          ? 'Browser blocked the model request under CSP.'
          : 'Browser model request failed.',
    );
  });

  try {
    await enableBrowserInspection(session);
  } catch {
    await close().catch(() => {});
    throw new Error('Could not enable browser model traffic inspection.');
  }
  return { completed: transfers.completed, failure: () => failure, close };
}

class ModelTrafficError extends Error {}
