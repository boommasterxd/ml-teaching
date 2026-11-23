import { loadGraphModelSync } from '@tensorflow/tfjs-converter';
import type { Tensor3D, Tensor4D } from '@tensorflow/tfjs-core';
import { ML } from '../constants';
import type { FeatureExtractor } from '../types/ml-models';
import { loadTensorFlow } from './ml-runtime';

const inputSize = ML.FEATURE_CANVAS_SIZE;
// TensorFlow Hub release used by MobileNet 2.1.1 for v2 with width multiplier 1.
const modelUrl =
  'https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/2/model.json?tfjs-format=file';
const embeddingNode = 'module_apply_default/MobilenetV2/Logits/AvgPool';

export async function loadMobileNetEmbedding(signal: AbortSignal): Promise<FeatureExtractor> {
  const tf = await loadTensorFlow();
  signal.throwIfAborted();
  const download = tf.io.http(modelUrl, { requestInit: { signal } });
  const artifacts = await download.load!();
  signal.throwIfAborted();

  // The converter allocates weights before constructing the graph. A tidy scope also
  // clears those weights if graph construction throws before it returns a model.
  let graph!: ReturnType<typeof loadGraphModelSync>;
  tf.tidy(() => {
    graph = loadGraphModelSync(artifacts);
    for (const weights of Object.values(graph.weights)) {
      for (const weight of weights) tf.keep(weight);
    }
  });

  return {
    infer: (input) =>
      tf.tidy(() => {
        // This published v2 graph takes [0, 1] inputs, as in MobileNet 2.1.1.
        const normalized = tf.mul(tf.cast(input, 'float32'), 1 / 255) as Tensor3D;
        const resized =
          input.shape[0] === inputSize && input.shape[1] === inputSize
            ? normalized
            : tf.image.resizeBilinear(normalized, [inputSize, inputSize], true);
        const frame = tf.reshape(resized, [1, inputSize, inputSize, 3]);
        return tf.squeeze(graph.execute(frame, embeddingNode) as Tensor4D, [1, 2]);
      }),
    dispose: () => graph.dispose(),
  };
}
