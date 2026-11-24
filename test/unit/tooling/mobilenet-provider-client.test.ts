import { describe, expect, it, vi } from 'vitest';
import { downloadModelFile } from '../../e2e/mobilenet-provider-client';
import contract from '../lib/fixtures/mobilenet-v2-embedding.json' with { type: 'json' };

const graph = new URL(contract.modelUrl);
const origin = 'http://127.0.0.1:3100';
const mirror = new URL(`/tfhub-tfjs-modules${graph.pathname}`, 'https://storage.googleapis.com');

describe('optional model provider transport', () => {
  it('fetches only the allowed graph locations and returns the decoded browser response', async () => {
    const fetchFile = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { Location: mirror.href } }),
      )
      .mockResolvedValueOnce(
        new Response('{"format":"graph-model"}', {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            'Content-Encoding': 'gzip',
            'Set-Cookie': 'provider-session=unused',
          },
        }),
      );

    const result = await downloadModelFile(graph, origin, fetchFile);
    expect(fetchFile.mock.calls.map(([url]) => url)).toEqual([graph, mirror]);
    for (const [, options] of fetchFile.mock.calls) {
      expect(options).toMatchObject({
        method: 'GET',
        redirect: 'manual',
        credentials: 'omit',
        headers: { Origin: origin },
      });
      expect(options?.body).toBeUndefined();
    }
    expect(result).toEqual({
      status: 200,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': origin },
      body: Buffer.from('{"format":"graph-model"}'),
    });
  });

  it.each([
    'https://unlisted.example/model.json',
    'https://storage.googleapis.com/other-bucket/model.json',
    new URL('other.bin?tfjs-format=file', graph).href,
  ])('rejects an unexpected redirect before sending it to %s', async (location) => {
    const fetchFile = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 302, headers: { Location: location } }));
    await expect(downloadModelFile(graph, origin, fetchFile)).rejects.toThrow(
      'Model redirect target is outside the permitted file locations',
    );
    expect(fetchFile).toHaveBeenCalledTimes(1);
  });

  it('returns binary weights with the provider content type', async () => {
    const shard = new URL('group1-shard1of2.bin?tfjs-format=file', graph);
    const bytes = Uint8Array.of(0, 255, 32);
    const fetchFile = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(bytes, { headers: { 'Content-Type': 'application/octet-stream' } }),
      );
    const response = await downloadModelFile(shard, origin, fetchFile);
    expect(response.headers['content-type']).toBe('application/octet-stream');
    expect(response.body).toEqual(Buffer.from(bytes));
  });

  it('stops a provider redirect loop within the request limit', async () => {
    const fetchFile = vi
      .fn<typeof fetch>()
      .mockImplementation(
        async () => new Response(null, { status: 307, headers: { Location: graph.href } }),
      );
    await expect(downloadModelFile(graph, origin, fetchFile)).rejects.toThrow('redirect limit');
    expect(fetchFile).toHaveBeenCalledTimes(5);
  });
});
