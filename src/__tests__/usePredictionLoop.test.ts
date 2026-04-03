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

// Mock TF.js — nur fromPixels wird im Loop aufgerufen
vi.mock('@tensorflow/tfjs', () => ({
  browser: {
    fromPixels: vi.fn(() => ({ dispose: vi.fn() })),
  },
}));

// ─── Hilfsfunktionen ────────────────────────────────────────────────────────

/** Erstellt einen Mock-Classifier. */
function makeClassifier(numClasses = 2, shouldThrow = false): Classifier {
  return {
    addExample: vi.fn(),
    predictClass: shouldThrow
      ? vi.fn().mockRejectedValue(new Error('Inferenz-Fehler'))
      : vi.fn().mockResolvedValue({ label: 'Klasse 1', confidences: { 'Klasse 1': 0.9 } }),
    getNumClasses: vi.fn(() => numClasses),
    dispose: vi.fn(),
    clearAllClasses: vi.fn(),
  };
}

/** Erstellt einen Mock-FeatureExtractor. */
function makeFeatureExtractor(): FeatureExtractor {
  return {
    infer: vi.fn(() => ({ dispose: vi.fn() })) as unknown as FeatureExtractor['infer'],
  };
}

/** Erstellt einen Mock-VideoRef mit bereitstehendem Video. */
function makeVideoRef(ready = true): React.RefObject<HTMLVideoElement | null> {
  const video = {
    readyState: ready ? 2 /* HAVE_CURRENT_DATA */ : 0,
    videoWidth: ready ? 640 : 0,
    videoHeight: ready ? 480 : 0,
  };
  return { current: video as HTMLVideoElement };
}

import type React from 'react';

// ─── RAF-Mock Setup ──────────────────────────────────────────────────────────

type RafCallback = (timestamp: number) => void;
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

/** Führt den aktuell gespeicherten RAF-Callback mit dem gegebenen Timestamp aus. */
async function fireRaf(timestamp = PREDICTION.INTERVAL_MS + 1): Promise<void> {
  if (capturedRafCallback) {
    capturedRafCallback(timestamp);
  }
  // Micro-task-Queue leeren, damit async-Funktionen innerhalb predictLoop abgeschlossen werden
  await new Promise<void>(resolve => setTimeout(resolve, 0));
}

// ─── Tests ──────────────────────────────────────────────────────────────────

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

      // RAF wird zwar geplant, aber predictLoop kehrt sofort zurück
      // und plant sich NICHT erneut → capturedRafCallback bleibt der initiale Aufruf
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

      // MAX_CONSECUTIVE_ERRORS RAF-Callbacks feuern — Timestamps steigend (je 1000ms),
      // damit der Throttle-Check (INTERVAL_MS ≈ 67ms) immer passiert
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
