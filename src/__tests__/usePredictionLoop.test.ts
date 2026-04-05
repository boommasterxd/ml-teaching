/**
 * usePredictionLoop.test.ts
 *
 * Unit tests for the usePredictionLoop hook. Covers initial state,
 * start/stop controls, guard conditions, and the consecutive-error
 * accumulation that stops the loop and surfaces an error to the UI.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePredictionLoop } from '../hooks/usePredictionLoop';
import { PREDICTION } from '../constants';
import type { Classifier, FeatureExtractor } from '../types/ml-models';

// Mock TF.js — only fromPixels is called inside the prediction loop.
vi.mock('@tensorflow/tfjs-core', () => ({
  browser: {
    fromPixels: vi.fn(() => ({ dispose: vi.fn() })),
  },
}));

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
    clearAllClasses: vi.fn(),
  };
}

/**
 * Creates a mock MobileNet feature extractor whose `infer` method returns
 * a disposable tensor stub.
 */
function makeFeatureExtractor(): FeatureExtractor {
  return {
    infer: vi.fn(() => ({ dispose: vi.fn() })) as unknown as FeatureExtractor['infer'],
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

beforeEach(() => {
  capturedRafCallback = null;
  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: RafCallback) => {
    capturedRafCallback = cb;
    return 1;
  }));
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
  await new Promise<void>(resolve => setTimeout(resolve, 0));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('usePredictionLoop', () => {
  const onError = vi.fn();

  beforeEach(() => {
    onError.mockClear();
  });

  describe('Initialer Zustand', () => {
    it('isPredicting startet als false', () => {
      const { result } = renderHook(() =>
        usePredictionLoop(null, null, { current: null }, onError)
      );
      expect(result.current.isPredicting).toBe(false);
    });

    it('prediction startet als null', () => {
      const { result } = renderHook(() =>
        usePredictionLoop(null, null, { current: null }, onError)
      );
      expect(result.current.prediction).toBeNull();
    });
  });

  describe('startPredicting / stopPredicting', () => {
    it('startPredicting setzt isPredicting auf true', () => {
      const { result } = renderHook(() =>
        usePredictionLoop(makeClassifier(), makeFeatureExtractor(), makeVideoRef(), onError)
      );

      act(() => { result.current.startPredicting(); });

      expect(result.current.isPredicting).toBe(true);
    });

    it('stopPredicting setzt isPredicting auf false', () => {
      const { result } = renderHook(() =>
        usePredictionLoop(makeClassifier(), makeFeatureExtractor(), makeVideoRef(), onError)
      );

      act(() => { result.current.startPredicting(); });
      act(() => { result.current.stopPredicting(); });

      expect(result.current.isPredicting).toBe(false);
    });

    it('stopPredicting setzt prediction auf null zurück', () => {
      const { result } = renderHook(() =>
        usePredictionLoop(makeClassifier(), makeFeatureExtractor(), makeVideoRef(), onError)
      );

      act(() => { result.current.startPredicting(); });
      act(() => { result.current.stopPredicting(); });

      expect(result.current.prediction).toBeNull();
    });
  });

  describe('Guard-Bedingungen', () => {
    it('plant keinen RAF wenn classifier null ist', () => {
      const { result } = renderHook(() =>
        usePredictionLoop(null, makeFeatureExtractor(), makeVideoRef(), onError)
      );

      act(() => { result.current.startPredicting(); });

      // RAF is scheduled, but predictLoop returns immediately without
      // re-scheduling — capturedRafCallback stays at the initial call.
      expect(requestAnimationFrame).toHaveBeenCalled();
    });

    it('plant keinen RAF wenn mobilenetModel null ist', () => {
      const { result } = renderHook(() =>
        usePredictionLoop(makeClassifier(), null, makeVideoRef(), onError)
      );

      act(() => { result.current.startPredicting(); });

      expect(requestAnimationFrame).toHaveBeenCalled();
    });

    it('führt keine Inferenz durch wenn Classifier 0 Klassen hat', async () => {
      const classifier = makeClassifier(0);
      const { result } = renderHook(() =>
        usePredictionLoop(classifier, makeFeatureExtractor(), makeVideoRef(), onError)
      );

      act(() => { result.current.startPredicting(); });
      await fireRaf();

      expect(classifier.predictClass).not.toHaveBeenCalled();
    });
  });

  describe('Fehlerakkumulation', () => {
    it('ruft onError nach MAX_CONSECUTIVE_ERRORS aufeinanderfolgenden Fehlern auf', async () => {
      const classifier = makeClassifier(2, true /* shouldThrow */);
      const model = makeFeatureExtractor();
      const videoRef = makeVideoRef();

      const { result } = renderHook(() =>
        usePredictionLoop(classifier, model, videoRef, onError)
      );

      await act(async () => { result.current.startPredicting(); });

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
        usePredictionLoop(classifier, makeFeatureExtractor(), makeVideoRef(), onError)
      );

      await act(async () => { result.current.startPredicting(); });

      for (let i = 0; i < PREDICTION.MAX_CONSECUTIVE_ERRORS; i++) {
        await act(async () => {
          await fireRaf((i + 1) * 1000);
        });
      }

      expect(result.current.isPredicting).toBe(false);
    });
  });
});
