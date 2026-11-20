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

export async function loadClassifierModule() {
  if (typeof window === 'undefined') throw new Error('Machine learning requires a browser.');
  return import('@tensorflow-models/knn-classifier');
}

export async function createClassifier() {
  const knn = await loadClassifierModule();
  return knn.create();
}

type DisposableModel = { dispose(): void };
type ModelAccess = { users: number; retired: boolean };

const modelAccess = new WeakMap<DisposableModel, ModelAccess>();

/** Hold the model until its GPU work and readback complete. */
export function retainModel(model: DisposableModel): (() => void) | undefined {
  let access = modelAccess.get(model);
  if (!access) {
    access = { users: 0, retired: false };
    modelAccess.set(model, access);
  }
  if (access.retired) return;
  const active = access;
  active.users++;
  return () => {
    active.users--;
    if (active.retired && active.users === 0) model.dispose();
  };
}

/** Prevent new work immediately and defer disposal only while the model is in use. */
export function retireModel(model: DisposableModel) {
  const access = modelAccess.get(model);
  if (access?.retired) return;
  if (access) {
    access.retired = true;
    if (access.users > 0) return;
  } else {
    modelAccess.set(model, { users: 0, retired: true });
  }
  model.dispose();
}
