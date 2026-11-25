import { describe, expect, it } from 'vitest';
import { createModelRequestPolicy } from '../../e2e/mobilenet-provider-client';
import contract from '../lib/fixtures/mobilenet-v2-embedding.json' with { type: 'json' };

const graph = new URL(contract.modelUrl);
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
const graphName = 'model.json';

function kaggle(file: string) {
  return new URL(file + '?tfjs-format=file&tfhub-redirect=true', kaggleDirectory);
}

function storage(file: string) {
  return new URL(file + '?' + storageQuery, storageDirectory);
}

function redirect(target: string | URL) {
  return [{ name: 'Location', value: String(target) }];
}

function length(bytes: number) {
  return [{ name: 'Content-Length', value: String(bytes) }];
}

type Policy = ReturnType<typeof createModelRequestPolicy>;

function completeRedirects(policy: Policy, file: string) {
  const initial = new URL(file + graph.search, graph);
  policy.allowRequest(file, initial);
  policy.allowResponse(file, 302, redirect(kaggle(file)));
  policy.allowRequest(file + '-kaggle', kaggle(file), file);
  policy.allowResponse(file + '-kaggle', 302, redirect(storage(file)));
  const storageId = file + '-storage';
  policy.allowRequest(storageId, storage(file), file + '-kaggle');
  return storageId;
}

describe('native model traffic policy', () => {
  it('accepts the bounded graph and four weights through both approved hops', () => {
    const policy = createModelRequestPolicy();
    const files = [graphName, ...[1, 2, 3, 4].map((index) => `group1-shard${index}of4.bin`)];
    for (const file of files) {
      const id = completeRedirects(policy, file);
      expect(policy.allowResponse(id, 200, length(4 * 1024 * 1024))).toBe(file);
    }
  });

  it.each([
    ['an unlisted host', 'https://unlisted.example/model.json'],
    ['a skipped provider stage', storage(graphName).href],
    ['a different file', kaggle('group1-shard1of4.bin').href],
    ['missing model parameters', new URL(graphName, kaggleDirectory).href],
  ])('rejects %s before approving the first redirect', (_scenario, target) => {
    const policy = createModelRequestPolicy();
    policy.allowRequest('graph', graph);
    expect(() => policy.allowResponse('graph', 302, redirect(target))).toThrow(
      'Model redirect is outside the permitted file locations.',
    );
    expect(() => policy.allowRequest('redirect', new URL(target), 'graph')).toThrow(
      'Model request does not match its approved redirect.',
    );
  });

  it('rejects a storage request that differs from the exact approved target', () => {
    const policy = createModelRequestPolicy();
    const mirror = kaggle(graphName);
    const target = storage(graphName);
    policy.allowRequest('graph', graph);
    policy.allowResponse('graph', 302, redirect(mirror));
    policy.allowRequest('mirror', mirror, 'graph');
    policy.allowResponse('mirror', 302, redirect(target));
    const altered = new URL(target);
    altered.searchParams.set('X-Goog-Signature', 'other');
    expect(() => policy.allowRequest('storage', altered, 'mirror')).toThrow(
      'Model request does not match its approved redirect.',
    );
  });

  it('rejects retries of the same file and unapproved entry paths', () => {
    const policy = createModelRequestPolicy();
    policy.allowRequest('first', graph);
    expect(() => policy.allowRequest('retry', graph)).toThrow('Model file was already requested.');
    expect(() => policy.allowRequest('other', new URL('unknown.bin', graph))).toThrow(
      'Model request is outside the permitted file locations.',
    );
  });

  it('rejects another redirect from storage', () => {
    const policy = createModelRequestPolicy();
    const id = completeRedirects(policy, graphName);
    expect(() => policy.allowResponse(id, 302, redirect(storage(graphName)))).toThrow(
      'Expected a successful model storage response.',
    );
  });

  it.each([
    ['without a content length', []],
    ['with ambiguous lengths', [...length(12), ...length(18)]],
    ['with an encoded body', [...length(12), { name: 'Content-Encoding', value: 'gzip' }]],
  ])('rejects a model response %s', (_case, headers) => {
    const policy = createModelRequestPolicy();
    const id = completeRedirects(policy, graphName);
    expect(() => policy.allowResponse(id, 200, headers)).toThrow(
      'Model response has no bounded identity-encoded body.',
    );
  });

  it('shares the byte limit across approved files before continuing their bodies', () => {
    const policy = createModelRequestPolicy();
    const graphId = completeRedirects(policy, graphName);
    const shardId = completeRedirects(policy, 'group1-shard1of4.bin');
    policy.allowResponse(graphId, 200, length(14 * 1024 * 1024));
    expect(() => policy.allowResponse(shardId, 200, length(14 * 1024 * 1024))).toThrow(
      'Model download exceeds its size limit.',
    );
  });
});
