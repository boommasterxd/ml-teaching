/**
 * usePredictionLoop.test.ts
 *
 * Unit tests for the usePredictionLoop hook. Covers initial state,
 * start/stop controls, guard conditions, and the consecutive-error
 * accumulation that stops the loop and surfaces an error to the UI.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePredictionLoop } from '@/hooks/usePredictionLoop';
import { PREDICTION } from '@/constants';
import { acquireWebGlBackend, retireModel } from '@/lib/ml-runtime';
import type { Classifier, FeatureExtractor } from '@/types/ml-models';

vi.mock('@tensorflow/tfjs-core', () => ({
  browser: {
    fromPixels: vi.fn(() => ({ dispose: vi.fn() })),
  },
  findBackendFactory: () => () => ({}),
  ready: vi.fn().mockResolvedValue(undefined),
  removeBackend: vi.fn(),
  setBackend: vi.fn().mockResolvedValue(true),
}));
vi.mock('@tensorflow/tfjs-backend-webgl', () => ({}));

// ─── Helper functions ────────────────────────────────────────────────────────

/**
 * Creates a mock KNN Classifier with a configurable number of classes.
 *
 * @param numClasses - Number of classes the classifier reports (default: 2).
 * @param shouldThrow - When true, `predictClass` rejects with an inference error.
 */
function makeClassifier(numClasses = 2, shouldThrow = false): Classifier {
  return {
    addExample: vi.fn(),
    predictClass: shouldThrow
      ? vi.fn().mockRejectedValue(new Error('Inference error'))
      : vi.fn().mockResolvedValue({ label: 'Class 1', confidences: { 'Class 1': 0.9 } }),
    getNumClasses: vi.fn(() => numClasses),
    dispose: vi.fn(),
    setClassifierDataset: vi.fn(),
  };
}

/**
 * Creates a mock MobileNet feature extractor whose `infer` method returns
 * a disposable tensor stub.
 */
function makeFeatureExtractor(): FeatureExtractor {
  return {
    infer: vi.fn(() => ({ dispose: vi.fn() })) as unknown as FeatureExtractor['infer'],
    dispose: vi.fn(),
  };
}

/**
 * Creates a mock React ref pointing to a stub HTMLVideoElement.
 *
 * @param ready - When true the video is in HAVE_CURRENT_DATA state with a
 *   640×480 frame; when false all values are 0 (not ready).
 */
function makeVideoRef(ready = true): React.RefObject<HTMLVideoElement | null> {
  const video = {
    readyState: ready ? 2 /* HAVE_CURRENT_DATA */ : 0,
    videoWidth: ready ? 640 : 0,
    videoHeight: ready ? 480 : 0,
  };
  return { current: video as HTMLVideoElement };
}

import type React from 'react';

// ─── RAF mock setup ──────────────────────────────────────────────────────────

/** Signature of a `requestAnimationFrame` callback. */
type RafCallback = (timestamp: number) => void;

/** Holds the most recently scheduled RAF callback so tests can fire it manually. */
let capturedRafCallback: RafCallback | null = null;
const makeFrameContext = () => ({
  setTransform: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  drawImage: vi.fn(),
});
let frameContext = makeFrameContext();

beforeEach(() => {
  frameContext = makeFrameContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(frameContext as never);
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  capturedRafCallback = null;
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((cb: RafCallback) => {
      capturedRafCallback = cb;
      return 1;
    }),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/**
 * Fires the currently captured RAF callback with the given timestamp and
 * flushes the microtask queue so any async work inside `predictLoop` completes.
 *
 * @param timestamp - DOMHighResTimeStamp passed to the callback (default: one
 *   tick past `PREDICTION.INTERVAL_MS` so the throttle check always passes).
 */
async function fireRaf(timestamp = PREDICTION.INTERVAL_MS + 1): Promise<void> {
  if (capturedRafCallback) {
    capturedRafCallback(timestamp);
  }
  // Drain the microtask queue so async functions inside predictLoop finish.
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('usePredictionLoop', () => {
  const onError = vi.fn();

  beforeEach(() => {
    onError.mockClear();
  });

  it('uses the same mirrored 224px square crop for front-camera inference as training', async () => {
    const classifier = makeClassifier();
    const model = makeFeatureExtractor();
    const videoRef = makeVideoRef();
    const { result } = renderHook(() =>
      usePredictionLoop(classifier, model, videoRef, onError, true),
    );
    act(() => result.current.startPredicting());
    await act(async () => {
      await fireRaf();
    });
    const tf = await import('@tensorflow/tfjs-core');
    const frame = vi.mocked(tf.browser.fromPixels).mock.lastCall?.[0] as HTMLCanvasElement;
    expect(frame).toBeInstanceOf(HTMLCanvasElement);
    expect(frame.width).toBe(224);
    expect(frame.height).toBe(224);
    expect(frameContext.drawImage).toHaveBeenCalledWith(
      videoRef.current,
      80,
      0,
      480,
      480,
      0,
      0,
      224,
      224,
    );
    expect(frameContext.translate).toHaveBeenCalledWith(224, 0);
    expect(frameContext.scale).toHaveBeenCalledWith(-1, 1);
    expect(result.current.prediction?.label).toBe('Class 1');
  });

  it('releases invalidated training data only after the last prediction settles', async () => {
    const classifier = makeClassifier();
    let finish!: (value: { label: string; confidences: Record<string, number> }) => void;
    vi.mocked(classifier.predictClass).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const model = makeFeatureExtractor();
    const videoRef = makeVideoRef();
    const { result } = renderHook(() => usePredictionLoop(classifier, model, videoRef, onError));
    act(() => result.current.startPredicting());
    await act(async () => {
      await fireRaf();
    });
    expect(classifier.predictClass).toHaveBeenCalledOnce();
    act(() => {
      result.current.stopPredicting();
      retireModel(classifier);
      retireModel(model);
    });
    expect(classifier.dispose).not.toHaveBeenCalled();
    expect(model.dispose).not.toHaveBeenCalled();
    await act(async () => {
      finish({ label: 'old', confidences: { old: 1 } });
    });
    expect(result.current.prediction).toBeNull();
    expect(result.current.isPredicting).toBe(false);
    expect(classifier.dispose).toHaveBeenCalledOnce();
    expect(model.dispose).toHaveBeenCalledOnce();
  });

  it('continues classifying with only one pending feature read and discards it after restart', async () => {
    const session = acquireWebGlBackend();
    const tf = await session.ready;
    const removeBackend = vi.mocked(tf.removeBackend).mockClear();
    const oldRead = Promise.withResolvers<Float32Array>();
    const first = { data: vi.fn(() => oldRead.promise), dispose: vi.fn() };
    const nextValues = new Float32Array([2]);
    const next = { data: vi.fn().mockResolvedValue(nextValues), dispose: vi.fn() };
    const model = makeFeatureExtractor();
    vi.mocked(model.infer)
      .mockReturnValueOnce(first as never)
      .mockImplementation(() => ({ ...next }) as never);
    const classifier = makeClassifier();
    const video = makeVideoRef();
    const onSample = vi.fn();
    const { result } = renderHook(() => usePredictionLoop(classifier, model, video, onError));
    act(() => {
      result.current.subscribeToFeatures({ shouldSample: () => true, onSample });
      result.current.startPredicting();
    });
    await act(() => fireRaf(1000));
    await act(() => fireRaf(2000));
    expect(classifier.predictClass).toHaveBeenCalledTimes(2);
    expect(first.data).toHaveBeenCalledOnce();
    expect(first.dispose).not.toHaveBeenCalled();
    expect(next.data).not.toHaveBeenCalled();
    expect(next.dispose).toHaveBeenCalledOnce();

    act(() => result.current.stopPredicting());
    session.release?.();
    await session.ready;
    expect(removeBackend).not.toHaveBeenCalled();

    const reopened = acquireWebGlBackend();
    act(() => result.current.startPredicting());
    await act(() => fireRaf(3000));
    expect(classifier.predictClass).toHaveBeenCalledTimes(3);
    expect(next.data).not.toHaveBeenCalled();
    await act(async () => oldRead.resolve(new Float32Array([1])));
    expect(first.dispose).toHaveBeenCalledOnce();
    expect(onSample).not.toHaveBeenCalled();

    await act(() => fireRaf(4000));
    expect(onSample).toHaveBeenCalledExactlyOnceWith(nextValues);
    expect(next.dispose).toHaveBeenCalledTimes(3);
    expect(onError).not.toHaveBeenCalled();
    reopened.release?.();
    await reopened.ready;
    expect(first.dispose).toHaveBeenCalledBefore(removeBackend);
    expect(removeBackend).toHaveBeenCalledExactlyOnceWith('webgl');
  });

  it('disposes a failed visualization read and samples a later classification', async () => {
    const failed = {
      data: vi.fn().mockRejectedValue(new Error('Readback failed')),
      dispose: vi.fn(),
    };
    const values = new Float32Array([3]);
    const next = { data: vi.fn().mockResolvedValue(values), dispose: vi.fn() };
    const model = makeFeatureExtractor();
    vi.mocked(model.infer)
      .mockReturnValueOnce(failed as never)
      .mockReturnValueOnce(next as never);
    const classifier = makeClassifier();
    const video = makeVideoRef();
    const onSample = vi.fn();
    const { result } = renderHook(() => usePredictionLoop(classifier, model, video, onError));
    act(() => {
      result.current.subscribeToFeatures({ shouldSample: () => true, onSample });
      result.current.startPredicting();
    });
    await act(() => fireRaf(1000));
    expect(failed.dispose).toHaveBeenCalledOnce();
    expect(result.current.prediction?.label).toBe('Class 1');
    expect(onSample).not.toHaveBeenCalled();

    await act(() => fireRaf(2000));
    expect(next.dispose).toHaveBeenCalledOnce();
    expect(onSample).toHaveBeenCalledExactlyOnceWith(values);
    expect(onError).not.toHaveBeenCalled();
  });

  it('releases the input tensor and reports repeated feature-extraction failures', async () => {
    const tf = await import('@tensorflow/tfjs-core');
    const input = { dispose: vi.fn() };
    vi.mocked(tf.browser.fromPixels).mockReturnValue(input as never);
    const classifier = makeClassifier();
    const model = makeFeatureExtractor();
    vi.mocked(model.infer).mockImplementation(() => {
      throw new Error('WebGL context lost');
    });
    const videoRef = makeVideoRef();
    const { result } = renderHook(() => usePredictionLoop(classifier, model, videoRef, onError));
    act(() => result.current.startPredicting());
    for (let i = 0; i < PREDICTION.MAX_CONSECUTIVE_ERRORS; i++) {
      await act(async () => {
        await fireRaf((i + 1) * 1000);
      });
    }
    expect(input.dispose).toHaveBeenCalledTimes(PREDICTION.MAX_CONSECUTIVE_ERRORS);
    expect(onError).toHaveBeenCalledWith('prediction', expect.any(String));
    expect(result.current.isPredicting).toBe(false);
  });

  describe('Initialer Zustand', () => {
    it('isPredicting startet als false', () => {
      const { result } = renderHook(() =>
        usePredictionLoop(null, null, { current: null }, onError),
      );
      expect(result.current.isPredicting).toBe(false);
    });

    it('prediction startet als null', () => {
      const { result } = renderHook(() =>
        usePredictionLoop(null, null, { current: null }, onError),
      );
      expect(result.current.prediction).toBeNull();
    });
  });

  describe('startPredicting / stopPredicting', () => {
    it('startPredicting setzt isPredicting auf true', () => {
      const { result } = renderHook(() =>
        usePredictionLoop(makeClassifier(), makeFeatureExtractor(), makeVideoRef(), onError),
      );

      act(() => {
        result.current.startPredicting();
      });

      expect(result.current.isPredicting).toBe(true);
    });

    it('stopPredicting setzt isPredicting auf false', () => {
      const { result } = renderHook(() =>
        usePredictionLoop(makeClassifier(), makeFeatureExtractor(), makeVideoRef(), onError),
      );

      act(() => {
        result.current.startPredicting();
      });
      act(() => {
        result.current.stopPredicting();
      });

      expect(result.current.isPredicting).toBe(false);
    });

    it('stopPredicting setzt prediction auf null zurück', () => {
      const { result } = renderHook(() =>
        usePredictionLoop(makeClassifier(), makeFeatureExtractor(), makeVideoRef(), onError),
      );

      act(() => {
        result.current.startPredicting();
      });
      act(() => {
        result.current.stopPredicting();
      });

      expect(result.current.prediction).toBeNull();
    });
  });

  describe('Guard-Bedingungen', () => {
    it('does not infer or schedule another frame when the classifier is missing', async () => {
      const model = makeFeatureExtractor();
      const { result } = renderHook(() => usePredictionLoop(null, model, makeVideoRef(), onError));

      act(() => {
        result.current.startPredicting();
      });

      await act(async () => fireRaf());
      expect(model.infer).not.toHaveBeenCalled();
      expect(requestAnimationFrame).toHaveBeenCalledOnce();
      expect(result.current.prediction).toBeNull();
      expect(onError).not.toHaveBeenCalled();
    });

    it('does not infer or schedule another frame when the feature extractor is missing', async () => {
      const classifier = makeClassifier();
      const { result } = renderHook(() =>
        usePredictionLoop(classifier, null, makeVideoRef(), onError),
      );

      act(() => {
        result.current.startPredicting();
      });

      await act(async () => fireRaf());
      expect(classifier.predictClass).not.toHaveBeenCalled();
      expect(requestAnimationFrame).toHaveBeenCalledOnce();
      expect(result.current.prediction).toBeNull();
      expect(onError).not.toHaveBeenCalled();
    });

    it('führt keine Inferenz durch wenn Classifier 0 Klassen hat', async () => {
      const classifier = makeClassifier(0);
      const { result } = renderHook(() =>
        usePredictionLoop(classifier, makeFeatureExtractor(), makeVideoRef(), onError),
      );

      act(() => {
        result.current.startPredicting();
      });
      await fireRaf();

      expect(classifier.predictClass).not.toHaveBeenCalled();
    });
  });

  describe('Fehlerakkumulation', () => {
    it('ruft onError nach MAX_CONSECUTIVE_ERRORS aufeinanderfolgenden Fehlern auf', async () => {
      const classifier = makeClassifier(2, true /* shouldThrow */);
      const model = makeFeatureExtractor();
      const videoRef = makeVideoRef();

      const { result } = renderHook(() => usePredictionLoop(classifier, model, videoRef, onError));

      await act(async () => {
        result.current.startPredicting();
      });

      // Fire MAX_CONSECUTIVE_ERRORS RAF callbacks with increasing timestamps
      // (1000 ms apart) so the throttle check (INTERVAL_MS ≈ 67 ms) always passes.
      for (let i = 0; i < PREDICTION.MAX_CONSECUTIVE_ERRORS; i++) {
        await act(async () => {
          await fireRaf((i + 1) * 1000);
        });
      }

      expect(onError).toHaveBeenCalledWith('prediction', expect.any(String));
    });

    it('setzt isPredicting auf false nach wiederholten Fehlern', async () => {
      const classifier = makeClassifier(2, true /* shouldThrow */);
      const { result } = renderHook(() =>
        usePredictionLoop(classifier, makeFeatureExtractor(), makeVideoRef(), onError),
      );

      await act(async () => {
        result.current.startPredicting();
      });

      for (let i = 0; i < PREDICTION.MAX_CONSECUTIVE_ERRORS; i++) {
        await act(async () => {
          await fireRaf((i + 1) * 1000);
        });
      }

      expect(result.current.isPredicting).toBe(false);
    });
  });
});
