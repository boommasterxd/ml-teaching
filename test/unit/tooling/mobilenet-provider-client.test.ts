import { describe, expect, it, vi } from 'vitest';
import { createModelDownloader } from '../../e2e/mobilenet-provider-client';
import contract from '../lib/fixtures/mobilenet-v2-embedding.json' with { type: 'json' };

const graph = new URL(contract.modelUrl);
const origin = 'http://127.0.0.1:3100';
const kaggleDirectory =
  'https://www.kaggle.com/models/google/mobilenet-v2/tfJs/100-224-classification/2/';
const storageDirectory = 'https://storage.googleapis.com/kagglesdsdata/models/2599/3646/';
const storageQuery = new URLSearchParams(
  [
    'X-Goog-Algorithm',
    'X-Goog-Credential',
    'X-Goog-Date',
    'X-Goog-Expires',
    'X-Goog-SignedHeaders',
    'X-Goog-Signature',
  ].map((key) => [key, 'fixture']),
);

function kaggle(file: string) {
  return new URL(file + '?tfjs-format=file&tfhub-redirect=true', kaggleDirectory);
}

function storage(file: string) {
  return new URL(file + '?' + storageQuery, storageDirectory);
}

function shard(index: number) {
  return new URL(`group1-shard${index}of4.bin?tfjs-format=file`, graph);
}

function redirect(target: string | URL) {
  return new Response(null, { status: 302, headers: { Location: String(target) } });
}

function modelFetch(final: (file: string) => Response) {
  return vi.fn<typeof fetch>().mockImplementation(async (input) => {
    const url = new URL(String(input));
    const file = url.pathname.split('/').at(-1)!;
    if (url.origin === graph.origin) return redirect(kaggle(file));
    if (url.origin === kaggle('model.json').origin) return redirect(storage(file));
    return final(file);
  });
}

describe('optional model provider transport', () => {
  it('downloads the known graph and four weights once through their exact provider locations', async () => {
    const fetchFile = modelFetch(
      (file) =>
        new Response(file, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Access-Control-Allow-Origin': origin,
            'Content-Encoding': 'gzip',
            'Set-Cookie': 'provider-session=unused',
          },
        }),
    );
    const downloader = createModelDownloader(origin, fetchFile);
    const originals = [graph, ...[1, 2, 3, 4].map(shard)];
    try {
      for (const original of originals) {
        const file = original.pathname.split('/').at(-1)!;
        expect(await downloader.download(original)).toEqual({
          status: 200,
          headers: {
            'content-type': 'application/octet-stream',
            'access-control-allow-origin': origin,
          },
          body: Buffer.from(file),
        });
      }
      expect(fetchFile.mock.calls.map(([url]) => url)).toEqual(
        originals.flatMap((url) => {
          const name = url.pathname.split('/').at(-1)!;
          return [url, kaggle(name), storage(name)];
        }),
      );
      for (const [, options] of fetchFile.mock.calls) {
        expect(options).toMatchObject({
          method: 'GET',
          redirect: 'manual',
          credentials: 'omit',
          headers: { Origin: origin },
        });
        expect(options?.body).toBeUndefined();
      }
    } finally {
      downloader.close();
    }
  });

  it.each([
    ['an unlisted host', 'https://unlisted.example/model.json'],
    ['a skipped provider stage', storage('model.json').href],
    ['a different file', kaggle('group1-shard1of4.bin').href],
    ['missing model parameters', new URL('model.json', kaggleDirectory).href],
  ])('rejects %s without fetching the first redirect target', async (_scenario, target) => {
    const fetchFile = vi.fn<typeof fetch>().mockResolvedValue(redirect(target));
    const downloader = createModelDownloader(origin, fetchFile);

    await expect(downloader.download(graph)).rejects.toThrow(
      'Model redirect target is outside the permitted file locations',
    );
    expect(fetchFile).toHaveBeenCalledTimes(1);
  });

  it('requires the known storage file before following the second hop', async () => {
    const fetchFile = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(redirect(kaggle('model.json')))
      .mockResolvedValueOnce(redirect(storage('group1-shard1of4.bin')));
    const downloader = createModelDownloader(origin, fetchFile);

    await expect(downloader.download(graph)).rejects.toThrow(
      'Model redirect target is outside the permitted file locations',
    );
    expect(fetchFile).toHaveBeenCalledTimes(2);
  });

  it('stops at the storage response and does not follow additional redirects', async () => {
    const fetchFile = modelFetch((file) => redirect(storage(file)));
    const downloader = createModelDownloader(origin, fetchFile);

    await expect(downloader.download(graph)).rejects.toThrow(
      'Expected a successful model file response',
    );
    expect(fetchFile).toHaveBeenCalledTimes(3);
  });

  it('rejects a repeated file and prevents further downloads in the same run', async () => {
    const fetchFile = modelFetch(() => new Response('model'));
    const downloader = createModelDownloader(origin, fetchFile);

    await downloader.download(graph);
    await expect(downloader.download(graph)).rejects.toThrow('Model file was already requested');
    await expect(downloader.download(shard(1))).rejects.toThrow();
    expect(fetchFile).toHaveBeenCalledTimes(3);
  });

  it('shares the byte limit across parallel file downloads and cancels both bodies', async () => {
    const chunk = new Uint8Array(4 * 1024 * 1024);
    const cancel = vi.fn();
    const responses = new Map<string, Response>();
    const fetchFile = modelFetch((file) => {
      const response = new Response(
        new ReadableStream<Uint8Array>({
          pull(controller) {
            controller.enqueue(chunk);
          },
          cancel,
        }),
      );
      responses.set(file, response);
      return response;
    });
    const downloader = createModelDownloader(origin, fetchFile);

    const results = await Promise.allSettled([
      downloader.download(shard(1)),
      downloader.download(shard(2)),
    ]);
    expect(results.map(({ status }) => status)).toEqual(['rejected', 'rejected']);
    expect(results).toContainEqual({
      status: 'rejected',
      reason: new Error('Model download exceeds the total size limit'),
    });
    expect(responses.size).toBe(2);
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(Array.from(responses.values()).every(({ body }) => !body?.locked)).toBe(true);
    expect(fetchFile.mock.calls.every(([, options]) => options?.signal?.aborted)).toBe(true);
  });

  it.each(['close', 'deadline'] as const)(
    'releases an active body reader when the %s aborts the download',
    async (termination) => {
      const elapsed = new AbortController();
      const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(elapsed.signal);
      const started = Promise.withResolvers<void>();
      const cancel = vi.fn();
      const body = new ReadableStream<Uint8Array>(
        {
          pull() {
            started.resolve();
          },
          cancel,
        },
        { highWaterMark: 0 },
      );
      const fetchFile = modelFetch(() => new Response(body));
      const downloader = createModelDownloader(origin, fetchFile);

      try {
        const download = downloader.download(graph);
        await started.promise;
        if (termination === 'close') downloader.close();
        else elapsed.abort();
        await expect(download).rejects.toThrow();
        expect(timeout).toHaveBeenCalledWith(25_000);
        expect(cancel).toHaveBeenCalledOnce();
        expect(body.locked).toBe(false);
      } finally {
        timeout.mockRestore();
        downloader.close();
      }
    },
  );
});
