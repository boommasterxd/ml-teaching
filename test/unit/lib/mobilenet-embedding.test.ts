import { createRequire } from 'node:module';
import * as tf from '@tensorflow/tfjs-core';
import { afterEach, expect, test, vi } from 'vitest';
import { loadMobileNetEmbedding } from '@/lib/mobilenet-embedding';
import contract from './fixtures/mobilenet-v2-embedding.json';

const require = createRequire(import.meta.url);
// Resolve the CPU backend through its declared parent in the locked dependency tree.
const requireFromWebgl = createRequire(require.resolve('@tensorflow/tfjs-backend-webgl'));
requireFromWebgl('@tensorflow/tfjs-backend-cpu');

const weightsFile = 'resize-size.bin';
const weightsUrl = new URL(weightsFile, contract.modelUrl);
weightsUrl.search = new URL(contract.modelUrl).search;

// Recreate the published pooling contract with three controlled feature channels.
// The preceding layers and model weights are not needed to exercise the adapter.
const graph = {
  format: 'graph-model',
  modelTopology: {
    versions: { producer: 1, minConsumer: 0 },
    node: [
      {
        name: 'images',
        op: 'Placeholder',
        attr: {
          dtype: { type: 'DT_FLOAT' },
          shape: {
            shape: {
              dim: [-1, contract.inputSize, contract.inputSize, 3].map((size) => ({
                size: String(size),
              })),
            },
          },
        },
      },
      { name: 'size', op: 'Const' },
      { name: 'features', op: 'ResizeBilinear', input: ['images', 'size'] },
      {
        name: contract.embedding.name,
        op: 'AvgPool',
        input: ['features'],
        attr: {
          padding: { s: Buffer.from(contract.embedding.padding).toString('base64') },
          data_format: { s: Buffer.from(contract.embedding.dataFormat).toString('base64') },
          ksize: { list: { i: contract.embedding.poolSize.map(String) } },
          strides: { list: { i: contract.embedding.strides.map(String) } },
        },
      },
    ],
  },
  weightsManifest: [
    { paths: [weightsFile], weights: [{ name: 'size', shape: [2], dtype: 'int32' }] },
  ],
};

afterEach(() => vi.unstubAllGlobals());

test('loads a graph and returns the pooled feature vector from an RGB image', async () => {
  await tf.setBackend('cpu');
  const signal = new AbortController().signal;
  vi.stubGlobal('fetch', async (url: string, options?: RequestInit) => {
    expect(options?.signal).toBe(signal);
    if (url === contract.modelUrl) return Response.json(graph);
    expect(url).toBe(weightsUrl.href);
    return new Response(new Int32Array(contract.embedding.poolSize.slice(1, 3)).buffer);
  });
  const initialTensors = tf.memory().numTensors;
  const model = await loadMobileNetEmbedding(signal);
  try {
    const result = tf.tidy(() => {
      const image = tf.tensor3d([255, 128, 0], [1, 1, 3], 'int32');
      const embedding = model.infer(image);
      return { shape: embedding.shape, values: [...embedding.dataSync()] };
    });
    expect(result.shape).toEqual([1, 3]);
    expect(result.values[0]).toBeCloseTo(1);
    expect(result.values[1]).toBeCloseTo(128 / 255);
    expect(result.values[2]).toBe(0);
  } finally {
    model.dispose();
  }
  expect(tf.memory().numTensors).toBe(initialTensors);
});
