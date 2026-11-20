import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const backend = vi.hoisted(() => ({ setBackend: vi.fn(), ready: vi.fn(), create: vi.fn() }));
vi.mock('@tensorflow/tfjs-core', () => ({ setBackend: backend.setBackend, ready: backend.ready }));
vi.mock('@tensorflow/tfjs-backend-webgl', () => ({}));
vi.mock('@tensorflow-models/knn-classifier', () => ({ create: backend.create }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  backend.setBackend.mockResolvedValue(true);
  backend.ready.mockResolvedValue(undefined);
  backend.create.mockImplementation(() => ({ dispose: vi.fn() }));
});
afterEach(() => vi.unstubAllGlobals());

describe('browser ML runtime', () => {
  it('shares backend initialization across concurrent browser consumers', async () => {
    const { initializeBackend } = await import('@/lib/ml-runtime');
    await Promise.all([initializeBackend(), initializeBackend()]);
    expect(backend.setBackend).toHaveBeenCalledExactlyOnceWith('webgl');
    expect(backend.ready).toHaveBeenCalledOnce();
  });

  it('allows a deliberate retry after failed WebGL initialization', async () => {
    backend.setBackend.mockRejectedValueOnce(new Error('WebGL unavailable'));
    const { initializeBackend } = await import('@/lib/ml-runtime');
    await expect(initializeBackend()).rejects.toThrow('WebGL unavailable');
    await initializeBackend();
    expect(backend.setBackend).toHaveBeenCalledTimes(2);
    expect(backend.ready).toHaveBeenCalledOnce();
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
