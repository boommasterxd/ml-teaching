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
const maximumFileBytes = 32 * 1024 * 1024;
const maximumModelBytes = 24 * 1024 * 1024;
const forwardedHeaders = [
  'content-type',
  'access-control-allow-origin',
  'access-control-allow-credentials',
  'access-control-expose-headers',
];

function isPlainHttps(url: URL) {
  return url.protocol === 'https:' && !url.username && !url.password && !url.hash;
}

function fileName(url: URL) {
  return url.pathname.slice(modelDirectory.pathname.length);
}

export function isModelFile(url: URL) {
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

function followRedirect(response: Response, current: URL, file: string) {
  void response.body?.cancel().catch(() => {});
  const location = response.headers.get('location');
  if (!redirectStatuses.has(response.status) || !location) {
    throw new Error('Expected a model file redirect');
  }
  let target: URL;
  try {
    target = new URL(location, current);
  } catch {
    throw new Error('Invalid model file redirect');
  }
  const allowed =
    current.origin === graph.origin ? isKaggleFile(target, file) : isStorageFile(target, file);
  if (!isPlainHttps(target) || !allowed) {
    throw new Error('Model redirect target is outside the permitted file locations');
  }
  return target;
}

async function readModelBody(
  response: Response,
  signal: AbortSignal,
  consume: (bytes: number) => void,
) {
  if (!response.body) throw new Error('Model file has no response body');
  const reader = response.body.getReader();
  const cancel = () => {
    void reader.cancel().catch(() => {});
  };
  const chunks: Uint8Array[] = [];
  let size = 0;
  signal.addEventListener('abort', cancel, { once: true });
  try {
    signal.throwIfAborted();
    for (;;) {
      const { done, value } = await reader.read().catch(() => {
        signal.throwIfAborted();
        throw new Error('Model file response could not be read');
      });
      signal.throwIfAborted();
      if (done) return Buffer.concat(chunks, size);
      size += value.byteLength;
      if (size > maximumFileBytes) throw new Error('Model file exceeds the size limit');
      consume(value.byteLength);
      chunks.push(value);
    }
  } finally {
    signal.removeEventListener('abort', cancel);
    cancel();
    reader.releaseLock();
  }
}

async function requestModelFile(
  initial: URL,
  origin: string,
  signal: AbortSignal,
  fetchFile: typeof fetch,
) {
  const request = async (url: URL) => {
    signal.throwIfAborted();
    try {
      return await fetchFile(url, {
        method: 'GET',
        redirect: 'manual',
        credentials: 'omit',
        headers: { Origin: origin },
        signal,
      });
    } catch {
      signal.throwIfAborted();
      throw new Error('Model file request failed');
    }
  };
  const file = fileName(initial);
  const kaggle = followRedirect(await request(initial), initial, file);
  const storage = followRedirect(await request(kaggle), kaggle, file);
  const response = await request(storage);
  if (response.status !== 200) {
    void response.body?.cancel().catch(() => {});
    throw new Error('Expected a successful model file response');
  }
  return response;
}

export function createModelDownloader(origin: string, fetchFile = fetch) {
  const controller = new AbortController();
  const requested = new Set<string>();
  let modelBytes = 0;

  function consume(bytes: number) {
    modelBytes += bytes;
    if (modelBytes > maximumModelBytes)
      throw new Error('Model download exceeds the total size limit');
  }

  return {
    async download(initial: URL) {
      try {
        controller.signal.throwIfAborted();
        if (!isModelFile(initial)) throw new Error('Unrecognized model file');
        const file = fileName(initial);
        if (requested.has(file)) throw new Error('Model file was already requested');
        requested.add(file);
        const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(downloadTimeout)]);
        const response = await requestModelFile(initial, origin, signal, fetchFile);
        const body = await readModelBody(response, signal, consume);
        const headers = Object.fromEntries(
          forwardedHeaders.flatMap((name) => {
            const value = response.headers.get(name);
            return value === null ? [] : [[name, value]];
          }),
        );
        // Fetch decodes the body. Playwright calculates the forwarded content length.
        return { status: response.status, headers, body };
      } catch (error) {
        controller.abort();
        throw error;
      }
    },
    close() {
      controller.abort();
    },
  };
}
