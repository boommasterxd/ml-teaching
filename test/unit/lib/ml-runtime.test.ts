import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const backend = vi.hoisted(() => ({
  factory: () => ({}),
  registered: true,
  setBackend: vi.fn(),
  ready: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(() => {
    backend.registered = false;
  }),
  register: vi.fn(() => {
    backend.registered = true;
  }),
}));
vi.mock('@tensorflow/tfjs-core', () => ({
  setBackend: backend.setBackend,
  ready: backend.ready,
  findBackendFactory: () => (backend.registered ? backend.factory : null),
  removeBackend: backend.remove,
  registerBackend: backend.register,
}));
vi.mock('@tensorflow/tfjs-backend-webgl', () => ({}));
vi.mock('@tensorflow-models/knn-classifier', () => ({ create: backend.create }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  backend.registered = true;
  backend.setBackend.mockImplementation(async () => backend.registered);
  backend.ready.mockResolvedValue(undefined);
  backend.create.mockImplementation(() => ({ dispose: vi.fn() }));
});
afterEach(() => vi.unstubAllGlobals());

describe('browser ML runtime', () => {
  it('shares backend initialization across concurrent browser consumers', async () => {
    const { acquireWebGlBackend } = await import('@/lib/ml-runtime');
    const first = acquireWebGlBackend();
    const second = acquireWebGlBackend();
    await Promise.all([first.ready, second.ready]);
    expect(backend.setBackend).toHaveBeenCalledExactlyOnceWith('webgl');
    expect(backend.ready).toHaveBeenCalledOnce();
    first.release?.();
    await first.ready;
    expect(backend.remove).not.toHaveBeenCalled();
    second.release?.();
    await second.ready;
    expect(backend.remove).toHaveBeenCalledExactlyOnceWith('webgl');

    const reopened = acquireWebGlBackend();
    await reopened.ready;
    expect(backend.register).toHaveBeenCalledExactlyOnceWith('webgl', backend.factory, 2);
    expect(backend.setBackend).toHaveBeenCalledTimes(2);
    reopened.release?.();
    await reopened.ready;
  });

  it('allows a deliberate retry after failed WebGL initialization', async () => {
    backend.setBackend.mockResolvedValueOnce(false);
    const { acquireWebGlBackend } = await import('@/lib/ml-runtime');
    const failed = acquireWebGlBackend();
    await expect(failed.ready).rejects.toThrow('WebGL backend unavailable');
    failed.release?.();
    const retried = acquireWebGlBackend();
    await retried.ready;
    expect(backend.setBackend).toHaveBeenCalledTimes(2);
    expect(backend.ready).toHaveBeenCalledOnce();
    retried.release?.();
    await retried.ready;
  });

  it('keeps the backend alive until a retired model finishes active use', async () => {
    const { acquireWebGlBackend, retainModel, retireModel } = await import('@/lib/ml-runtime');
    const session = acquireWebGlBackend();
    await session.ready;
    const model = { dispose: vi.fn() };
    const finishPrediction = retainModel(model);
    retireModel(model);
    session.release?.();
    await session.ready;
    expect(retainModel(model)).toBeUndefined();
    expect(model.dispose).not.toHaveBeenCalled();
    expect(backend.remove).not.toHaveBeenCalled();
    finishPrediction?.();
    await session.ready;
    expect(model.dispose).toHaveBeenCalledBefore(backend.remove);
    expect(backend.remove).toHaveBeenCalledOnce();
  });

  it('drains pending initialization before disposing a withdrawn session', async () => {
    const initializing = Promise.withResolvers<boolean>();
    backend.setBackend.mockReturnValueOnce(initializing.promise);
    const { acquireWebGlBackend } = await import('@/lib/ml-runtime');
    const session = acquireWebGlBackend();
    session.release?.();
    expect(backend.remove).not.toHaveBeenCalled();
    initializing.resolve(true);
    await session.ready;
    expect(backend.remove).toHaveBeenCalledExactlyOnceWith('webgl');
  });

  it('creates separate classifiers without carrying training samples across workspaces', async () => {
    const { createClassifier } = await import('@/lib/ml-runtime');
    const first = await createClassifier();
    const second = await createClassifier();
    expect(first).not.toBe(second);
    expect(backend.create).toHaveBeenCalledTimes(2);
  });

  it('rejects ML activation in the server rendering environment', async () => {
    vi.stubGlobal('window', undefined);
    const { loadTensorFlow, createClassifier } = await import('@/lib/ml-runtime');
    await expect(loadTensorFlow()).rejects.toThrow('requires a browser');
    await expect(createClassifier()).rejects.toThrow('requires a browser');
    expect(backend.setBackend).not.toHaveBeenCalled();
    expect(backend.create).not.toHaveBeenCalled();
  });
});
