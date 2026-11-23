/** Browser-only entry point. Call only after the model-download consent. */
export async function loadTensorFlow() {
  if (typeof window === 'undefined') throw new Error('Machine learning requires a browser.');
  return import('@tensorflow/tfjs-core');
}

type TensorFlow = Awaited<ReturnType<typeof loadTensorFlow>>;
let backendReady: Promise<TensorFlow> | undefined;
let backendFactory: ReturnType<TensorFlow['findBackendFactory']> | undefined;
let backendUsers = 0;

async function initializeBackend() {
  const tf = await loadTensorFlow();
  await import('@tensorflow/tfjs-backend-webgl');
  // Removing a TF.js backend also unregisters its factory. The import only runs once.
  const registered = tf.findBackendFactory('webgl');
  backendFactory ??= registered;
  if (!registered && backendFactory) tf.registerBackend('webgl', backendFactory, 2);
  try {
    if (!(await tf.setBackend('webgl'))) throw new Error('WebGL backend unavailable.');
    await tf.ready();
    return tf;
  } catch (error) {
    if (tf.findBackendFactory('webgl')) tf.removeBackend('webgl');
    throw error;
  }
}

export function retainBackendWork() {
  const ready = backendReady;
  if (!ready) return undefined;
  backendUsers++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    backendUsers--;
    if (backendUsers !== 0) return;
    // Initialization and teardown must settle in order, including after an early abort.
    void ready
      .then(
        (tf) => {
          if (backendReady !== ready || backendUsers !== 0) return;
          backendReady = undefined;
          tf.removeBackend('webgl');
        },
        () => {},
      )
      .catch(() => console.error('Could not release the TensorFlow WebGL backend.'));
  };
}

export function acquireWebGlBackend() {
  const ready = (backendReady ??= initializeBackend().catch((error: unknown) => {
    backendReady = undefined;
    throw error;
  }));
  const release = retainBackendWork();
  return { ready, release };
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
  const releaseBackend = retainBackendWork();
  return () => {
    active.users--;
    try {
      if (active.retired && active.users === 0) model.dispose();
    } finally {
      releaseBackend?.();
    }
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
