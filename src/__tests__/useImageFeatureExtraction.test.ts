/**
 * useImageFeatureExtraction.test.ts
 *
 * Unit tests for the useImageFeatureExtraction hook. Covers successful feature
 * extraction, null-guards (no model, zero dimensions), the critical tensor
 * disposal in the finally block (including on infer() failure), mirror mode
 * canvas transform, and thumbnail data URL generation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageFeatureExtraction } from '../hooks/useImageFeatureExtraction';
import { ML } from '../constants';
import type { FeatureExtractor } from '../types/ml-models';

// Mock TF.js — only browser.fromPixels is called inside the hook.
vi.mock('@tensorflow/tfjs', () => ({
  browser: {
    fromPixels: vi.fn(),
  },
}));

// ─── Mock Factories ──────────────────────────────────────────────────────────

/**
 * Creates a disposable tensor stub with a configurable data array.
 *
 * @param data - Float32 values returned by `.data()` (default: [0.1, 0.2]).
 */
function makeTensor(data: number[] = [0.1, 0.2]) {
  return {
    dispose: vi.fn(),
    data: vi.fn().mockResolvedValue(new Float32Array(data)),
  };
}

/**
 * Creates a mock FeatureExtractor whose `infer` returns a tensor stub.
 *
 * @param featureTensor - The tensor returned by `infer` (default: makeTensor()).
 */
function makeFeatureExtractor(featureTensor = makeTensor()): FeatureExtractor {
  return {
    infer: vi.fn(() => featureTensor) as unknown as FeatureExtractor['infer'],
  };
}

/**
 * Creates a mock Canvas 2D context with spies on all methods used by the hook.
 */
function makeCanvasContext() {
  return {
    setTransform: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
  };
}

/**
 * Creates a real HTMLVideoElement (jsdom) with overridden videoWidth/videoHeight.
 * Using a real instance ensures `instanceof HTMLVideoElement` checks in the hook
 * work correctly so the guard conditions are exercised as intended.
 *
 * @param width - videoWidth (default: 640).
 * @param height - videoHeight (default: 480).
 */
function makeVideoSource(width = 640, height = 480): HTMLVideoElement {
  const video = document.createElement('video') as HTMLVideoElement;
  Object.defineProperty(video, 'videoWidth', { get: () => width, configurable: true });
  Object.defineProperty(video, 'videoHeight', { get: () => height, configurable: true });
  return video;
}

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(async () => {
  const tfMock = await import('@tensorflow/tfjs');
  vi.mocked(tfMock.browser.fromPixels).mockReturnValue(makeTensor() as never);

  vi.stubGlobal('crypto', {
    randomUUID: vi.fn(() => 'test-uuid-1234'),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useImageFeatureExtraction', () => {
  describe('Null-Guards', () => {
    it('gibt null zurück wenn kein Modell übergeben wurde', async () => {
      const { result } = renderHook(() => useImageFeatureExtraction(null));

      let mlImage = null;
      await act(async () => {
        mlImage = await result.current.extractFeatures(makeVideoSource(), false);
      });

      expect(mlImage).toBeNull();
    });

    it('gibt null zurück wenn videoWidth 0 ist', async () => {
      const model = makeFeatureExtractor();
      const { result } = renderHook(() => useImageFeatureExtraction(model));

      let mlImage = null;
      await act(async () => {
        mlImage = await result.current.extractFeatures(makeVideoSource(0, 480), false);
      });

      expect(mlImage).toBeNull();
    });

    it('gibt null zurück wenn videoHeight 0 ist', async () => {
      const model = makeFeatureExtractor();
      const { result } = renderHook(() => useImageFeatureExtraction(model));

      let mlImage = null;
      await act(async () => {
        mlImage = await result.current.extractFeatures(makeVideoSource(640, 0), false);
      });

      expect(mlImage).toBeNull();
    });
  });

  describe('Erfolgreiche Feature-Extraktion', () => {
    it('gibt ein MLImage mit id, dataUrl und featureArray zurück', async () => {
      const ctx = makeCanvasContext();
      const mockCanvas = {
        width: ML.FEATURE_CANVAS_SIZE,
        height: ML.FEATURE_CANVAS_SIZE,
        getContext: vi.fn(() => ctx),
        toDataURL: vi.fn(() => 'data:image/jpeg;base64,abc'),
      };
      // Only intercept 'canvas' — other tags (e.g. 'div' used by renderHook) must
      // return real DOM nodes so jsdom's appendChild does not throw.
      const original = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string, ...args) =>
        tag === 'canvas' ? (mockCanvas as unknown as HTMLElement) : original(tag, ...args)
      );

      const featureData = [0.5, 0.3, 0.2];
      const model = makeFeatureExtractor(makeTensor(featureData));
      const { result } = renderHook(() => useImageFeatureExtraction(model));

      let mlImage: Awaited<ReturnType<typeof result.current.extractFeatures>> = null;
      await act(async () => {
        mlImage = await result.current.extractFeatures(makeVideoSource(), false);
      });

      expect(mlImage).not.toBeNull();
      expect(mlImage!.id).toBe('img-test-uuid-1234');
      expect(mlImage!.dataUrl).toBe('data:image/jpeg;base64,abc');
      // Float32Array truncates values — compare against the same precision.
      expect(mlImage!.featureArray).toEqual(Array.from(new Float32Array([0.5, 0.3, 0.2])));
    });

    it('erstellt den Canvas mit der korrekten Größe (FEATURE_CANVAS_SIZE)', async () => {
      const ctx = makeCanvasContext();
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ctx),
        toDataURL: vi.fn(() => 'data:image/jpeg;base64,x'),
      };
      const original = document.createElement.bind(document);
      const createElementSpy = vi
        .spyOn(document, 'createElement')
        .mockImplementation((tag: string, ...args) =>
          tag === 'canvas' ? (mockCanvas as unknown as HTMLElement) : original(tag, ...args)
        );

      const model = makeFeatureExtractor();
      const { result } = renderHook(() => useImageFeatureExtraction(model));

      await act(async () => {
        await result.current.extractFeatures(makeVideoSource(), false);
      });

      expect(createElementSpy).toHaveBeenCalledWith('canvas');
      expect(mockCanvas.width).toBe(ML.FEATURE_CANVAS_SIZE);
      expect(mockCanvas.height).toBe(ML.FEATURE_CANVAS_SIZE);
    });
  });

  describe('Tensor-Disposal', () => {
    it('disposed den input-Tensor und den feature-Tensor nach erfolgreicher Extraktion', async () => {
      const ctx = makeCanvasContext();
      const mockCanvas = {
        width: ML.FEATURE_CANVAS_SIZE,
        height: ML.FEATURE_CANVAS_SIZE,
        getContext: vi.fn(() => ctx),
        toDataURL: vi.fn(() => 'data:image/jpeg;base64,x'),
      };
      const original = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string, ...args) =>
        tag === 'canvas' ? (mockCanvas as unknown as HTMLElement) : original(tag, ...args)
      );

      const featureTensor = makeTensor();
      const inputTensor = makeTensor();
      const tfMock = await import('@tensorflow/tfjs');
      vi.mocked(tfMock.browser.fromPixels).mockReturnValue(inputTensor as never);

      const model = makeFeatureExtractor(featureTensor);
      const { result } = renderHook(() => useImageFeatureExtraction(model));

      await act(async () => {
        await result.current.extractFeatures(makeVideoSource(), false);
      });

      expect(inputTensor.dispose).toHaveBeenCalledOnce();
      expect(featureTensor.dispose).toHaveBeenCalledOnce();
    });

    it('disposed den input-Tensor auch wenn infer() einen Fehler wirft', async () => {
      const inputTensor = makeTensor();
      const tfMock = await import('@tensorflow/tfjs');
      vi.mocked(tfMock.browser.fromPixels).mockReturnValue(inputTensor as never);

      const errorModel: FeatureExtractor = {
        infer: vi.fn(() => { throw new Error('GPU-Fehler'); }) as unknown as FeatureExtractor['infer'],
      };
      const { result } = renderHook(() => useImageFeatureExtraction(errorModel));

      await act(async () => {
        await expect(
          result.current.extractFeatures(makeVideoSource(), false)
        ).rejects.toThrow('GPU-Fehler');
      });

      expect(inputTensor.dispose).toHaveBeenCalledOnce();
    });
  });

  describe('Mirror-Modus', () => {
    it('setzt translate und scale(-1, 1) wenn mirror true ist', async () => {
      const ctx = makeCanvasContext();
      const mockCanvas = {
        width: ML.FEATURE_CANVAS_SIZE,
        height: ML.FEATURE_CANVAS_SIZE,
        getContext: vi.fn(() => ctx),
        toDataURL: vi.fn(() => 'data:image/jpeg;base64,x'),
      };
      const original = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string, ...args) =>
        tag === 'canvas' ? (mockCanvas as unknown as HTMLElement) : original(tag, ...args)
      );

      const model = makeFeatureExtractor();
      const { result } = renderHook(() => useImageFeatureExtraction(model));

      await act(async () => {
        await result.current.extractFeatures(makeVideoSource(), true);
      });

      expect(ctx.translate).toHaveBeenCalledWith(ML.FEATURE_CANVAS_SIZE, 0);
      expect(ctx.scale).toHaveBeenCalledWith(-1, 1);
    });

    it('setzt kein translate/scale wenn mirror false ist', async () => {
      const ctx = makeCanvasContext();
      const mockCanvas = {
        width: ML.FEATURE_CANVAS_SIZE,
        height: ML.FEATURE_CANVAS_SIZE,
        getContext: vi.fn(() => ctx),
        toDataURL: vi.fn(() => 'data:image/jpeg;base64,x'),
      };
      const original = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string, ...args) =>
        tag === 'canvas' ? (mockCanvas as unknown as HTMLElement) : original(tag, ...args)
      );

      const model = makeFeatureExtractor();
      const { result } = renderHook(() => useImageFeatureExtraction(model));

      await act(async () => {
        await result.current.extractFeatures(makeVideoSource(), false);
      });

      expect(ctx.translate).not.toHaveBeenCalled();
      expect(ctx.scale).not.toHaveBeenCalled();
    });
  });
});
