import contract from '../unit/lib/fixtures/mobilenet-v2-embedding.json' with { type: 'json' };

const graph = new URL(contract.modelUrl);
export const modelDirectory = new URL('.', graph);
const storageOrigin = 'https://storage.googleapis.com';
const mirrorDirectory = `/tfhub-tfjs-modules${modelDirectory.pathname}`;
const redirectStatuses = new Set([301, 302, 303, 307, 308]);
const downloadTimeout = 25_000;
const maximumBytes = 32 * 1024 * 1024;
const forwardedHeaders = [
  'content-type',
  'access-control-allow-origin',
  'access-control-allow-credentials',
  'access-control-expose-headers',
];

export function isModelFile(url: URL) {
  if (!isPlainHttps(url) || url.origin !== graph.origin || url.search !== graph.search)
    return false;
  const file = url.pathname.slice(modelDirectory.pathname.length);
  return (
    url.pathname.startsWith(modelDirectory.pathname) &&
    (url.href === graph.href || /^[\w.-]+\.bin$/.test(file))
  );
}

function isPlainHttps(url: URL) {
  return url.protocol === 'https:' && !url.username && !url.password && !url.hash;
}

function nextModelUrl(location: string | null, current: URL, file: string) {
  let target: URL;
  try {
    if (!location) throw new Error();
    target = new URL(location, current);
  } catch {
    throw new Error('Missing or invalid model redirect');
  }
  const isSourceFile = isModelFile(target) && target.pathname === modelDirectory.pathname + file;
  const isMirrorFile =
    target.origin === storageOrigin && target.pathname === mirrorDirectory + file;
  if (!isPlainHttps(target) || (!isSourceFile && !isMirrorFile)) {
    throw new Error('Model redirect target is outside the permitted file locations');
  }
  return target;
}

async function readModelBody(response: Response) {
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return Buffer.concat(chunks, size);
      size += value.byteLength;
      if (size > maximumBytes) throw new Error('Model response exceeds the size limit');
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function downloadModelFile(initial: URL, origin: string, fetchFile = fetch) {
  if (!isModelFile(initial)) throw new Error('Unrecognized model file');
  const file = initial.pathname.slice(modelDirectory.pathname.length);
  const signal = AbortSignal.timeout(downloadTimeout);
  let target = initial;
  for (let redirects = 0; redirects <= 4; redirects += 1) {
    const response = await fetchFile(target, {
      method: 'GET',
      redirect: 'manual',
      credentials: 'omit',
      headers: { Origin: origin },
      signal,
    });
    if (redirectStatuses.has(response.status)) {
      await response.body?.cancel();
      target = nextModelUrl(response.headers.get('location'), target, file);
      continue;
    }
    const headers: Record<string, string> = {};
    for (const name of forwardedHeaders) {
      const value = response.headers.get(name);
      if (value !== null) headers[name] = value;
    }
    // Fetch already decodes transfer content. Playwright calculates the new body length.
    return { status: response.status, headers, body: await readModelBody(response) };
  }
  throw new Error('Model download exceeded the redirect limit');
}
