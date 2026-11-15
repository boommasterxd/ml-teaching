/** Browser-only entry point. Call only after the model-download consent. */
export async function loadTensorFlow() {
  if (typeof window === 'undefined') throw new Error('Machine learning requires a browser.');
  return import('@tensorflow/tfjs-core');
}

let backendReady: Promise<void> | undefined;

export async function initializeBackend() {
  backendReady ??= (async () => {
    const tf = await loadTensorFlow();
    await import('@tensorflow/tfjs-backend-webgl');
    await tf.setBackend('webgl');
    await tf.ready();
  })().catch((error) => {
    backendReady = undefined;
    throw error;
  });
  return backendReady;
}

export async function createClassifier() {
  if (typeof window === 'undefined') throw new Error('Machine learning requires a browser.');
  const knn = await import('@tensorflow-models/knn-classifier');
  return knn.create();
}
