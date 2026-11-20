/**
 * useModelLoader.test.ts
 *
 * Unit tests for the useModelLoader hook. Uses the optional loaderFns DI
 * parameter to inject stubs instead of real TF.js / network calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModelLoader } from '@/hooks/useModelLoader';
import type { ModelLoaderFunctions } from '@/hooks/useModelLoader';
import type { Classifier, FeatureExtractor } from '@/types/ml-models';

const { loadMobileNetEmbedding } = vi.hoisted(() => ({ loadMobileNetEmbedding: vi.fn() }));
vi.mock('@/lib/mobilenet-embedding', () => ({ loadMobileNetEmbedding }));

// ─── Mock Factories ──────────────────────────────────────────────────────────

/**
 * Creates a fully stubbed Classifier mock with all required methods as spies.
 *
 * @returns A Classifier stub where predictClass resolves with a single class 'A' at full confidence.
 */
function makeClassifier(): Classifier {
  return {
    addExample: vi.fn(),
    predictClass: vi.fn().mockResolvedValue({ label: 'A', confidences: { A: 1 } }),
    getNumClasses: vi.fn(() => 0),
    dispose: vi.fn(),
    setClassifierDataset: vi.fn(),
  };
}

/**
 * Creates a minimal FeatureExtractor stub with a disposable infer spy.
 *
 * @returns A FeatureExtractor stub whose infer method returns an object with a no-op dispose.
 */
function makeFeatureExtractor(): FeatureExtractor {
  return {
    infer: vi.fn(() => ({ dispose: vi.fn() })) as unknown as FeatureExtractor['infer'],
    dispose: vi.fn(),
  };
}

/**
 * Creates a fully successful loaderFns implementation.
 *
 * @param classifier - Classifier stub to return from createClassifier.
 * @param featureExtractor - FeatureExtractor stub to return from loadFeatureExtractor.
 * @returns A complete ModelLoaderFunctions stub where all steps succeed.
 */
function makeSuccessfulLoaderFns(
  classifier: Classifier,
  featureExtractor: FeatureExtractor,
): ModelLoaderFunctions {
  return {
    warmup: vi.fn(async () => {}),
    initBackend: vi.fn(async (setLoadingText) => {
      setLoadingText('Lade TensorFlow.js Backend...');
    }),
    createClassifier: vi.fn(async (setLoadingText) => {
      setLoadingText('Erstelle KNN Klassifikator...');
      return classifier;
    }),
    loadFeatureExtractor: vi.fn(async (setLoadingText) => {
      setLoadingText('Lade MobileNet (Feature Extractor)...');
      return featureExtractor;
    }),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useModelLoader', () => {
  /** Shared error callback spy, cleared before each test. */
  const onError = vi.fn();

  beforeEach(() => {
    onError.mockClear();
    loadMobileNetEmbedding.mockReset();
    // Suppress console.error output from expected error paths under test.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialer Zustand', () => {
    it('isModelLoading startet als true', () => {
      const { result } = renderHook(() => useModelLoader(false, onError));
      expect(result.current.isModelLoading).toBe(true);
    });

    it('classifier startet als null', () => {
      const { result } = renderHook(() => useModelLoader(false, onError));
      expect(result.current.classifier).toBeNull();
    });

    it('mobilenetModel startet als null', () => {
      const { result } = renderHook(() => useModelLoader(false, onError));
      expect(result.current.mobilenetModel).toBeNull();
    });
  });

  describe('Kein Laden ohne Consent', () => {
    it('bleibt im Ladezustand wenn hasConsented false ist', async () => {
      const loaderFns = makeSuccessfulLoaderFns(makeClassifier(), makeFeatureExtractor());
      const { result } = renderHook(() => useModelLoader(false, onError, loaderFns));

      // Wait for any potential async side effects
      await act(async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      });

      expect(loaderFns.initBackend).not.toHaveBeenCalled();
      expect(result.current.classifier).toBeNull();
      expect(result.current.mobilenetModel).toBeNull();
    });
  });

  describe('Erfolgreiches Laden', () => {
    it('setzt classifier und mobilenetModel nach Consent', async () => {
      const classifier = makeClassifier();
      const featureExtractor = makeFeatureExtractor();
      const loaderFns = makeSuccessfulLoaderFns(classifier, featureExtractor);

      const { result } = renderHook(() => useModelLoader(true, onError, loaderFns));

      await act(async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.classifier).toBe(classifier);
      expect(result.current.mobilenetModel).toBe(featureExtractor);
    });

    it('setzt isModelLoading auf false nach erfolgreichem Laden', async () => {
      const loaderFns = makeSuccessfulLoaderFns(makeClassifier(), makeFeatureExtractor());

      const { result } = renderHook(() => useModelLoader(true, onError, loaderFns));

      await act(async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isModelLoading).toBe(false);
    });

    it('ruft alle drei Loader-Funktionen auf', async () => {
      const loaderFns = makeSuccessfulLoaderFns(makeClassifier(), makeFeatureExtractor());

      renderHook(() => useModelLoader(true, onError, loaderFns));

      await act(async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      });

      expect(loaderFns.initBackend).toHaveBeenCalledOnce();
      expect(loaderFns.createClassifier).toHaveBeenCalledOnce();
      expect(loaderFns.loadFeatureExtractor).toHaveBeenCalledOnce();
    });

    it('aktualisiert loadingText während der Ladeschritte', async () => {
      const classifier = makeClassifier();
      const featureExtractor = makeFeatureExtractor();
      const backend = Promise.withResolvers<void>();
      const knn = Promise.withResolvers<void>();
      const mobileNet = Promise.withResolvers<void>();
      const warmup = Promise.withResolvers<void>();
      const loaderFns: ModelLoaderFunctions = {
        warmup: () => warmup.promise,
        initBackend: vi.fn(async (setLoadingText) => {
          setLoadingText('Backend...');
          await backend.promise;
        }),
        createClassifier: vi.fn(async (setLoadingText) => {
          setLoadingText('KNN...');
          await knn.promise;
          return classifier;
        }),
        loadFeatureExtractor: vi.fn(async (setLoadingText) => {
          setLoadingText('MobileNet...');
          await mobileNet.promise;
          return featureExtractor;
        }),
      };
      const { result } = renderHook(() => useModelLoader(true, onError, loaderFns));
      expect(result.current.loadingText).toBe('Backend...');
      expect(result.current.isModelLoading).toBe(true);
      await act(async () => backend.resolve());
      expect(result.current.loadingText).toBe('KNN...');
      await act(async () => knn.resolve());
      expect(result.current.loadingText).toBe('MobileNet...');
      await act(async () => mobileNet.resolve());
      expect(result.current.loadingText).toBe('Optimiere GPU-Performance...');
      expect(result.current.isModelLoading).toBe(true);
      expect(result.current.mobilenetModel).toBeNull();
      await act(async () => warmup.resolve());
      expect(result.current.isModelLoading).toBe(false);
      expect(result.current.mobilenetModel).toBe(featureExtractor);
    });
  });

  describe('Fehlerbehandlung', () => {
    it('ruft onError auf wenn initBackend fehlschlägt', async () => {
      const loaderFns: ModelLoaderFunctions = {
        initBackend: vi.fn().mockRejectedValue(new Error('Backend-Fehler')),
        createClassifier: vi.fn(),
        loadFeatureExtractor: vi.fn(),
      };

      renderHook(() => useModelLoader(true, onError, loaderFns));

      await act(async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      });

      expect(onError).toHaveBeenCalledWith('model', expect.any(String));
    });

    it('ruft onError auf wenn loadFeatureExtractor fehlschlägt', async () => {
      const loaderFns: ModelLoaderFunctions = {
        initBackend: vi.fn(async () => {}),
        createClassifier: vi.fn(async () => makeClassifier()),
        loadFeatureExtractor: vi.fn().mockRejectedValue(new Error('MobileNet-Fehler')),
      };

      renderHook(() => useModelLoader(true, onError, loaderFns));

      await act(async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      });

      expect(onError).toHaveBeenCalledWith('model', expect.any(String));
    });

    it('setzt isModelLoading auf false nach Fehler', async () => {
      const loaderFns: ModelLoaderFunctions = {
        initBackend: vi.fn().mockRejectedValue(new Error('Fehler')),
        createClassifier: vi.fn(),
        loadFeatureExtractor: vi.fn(),
      };

      const { result } = renderHook(() => useModelLoader(true, onError, loaderFns));

      await act(async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isModelLoading).toBe(false);
    });
  });

  describe('Abort bei Unmount', () => {
    it('aborts the previous model request and waits for its late GPU work before reentry', async () => {
      const pending = Promise.withResolvers<FeatureExtractor>();
      const oldModel = makeFeatureExtractor();
      const newModel = makeFeatureExtractor();
      loadMobileNetEmbedding.mockReturnValueOnce(pending.promise).mockResolvedValueOnce(newModel);
      const localLoaders = () => ({
        initBackend: vi.fn().mockResolvedValue(undefined),
        createClassifier: vi.fn().mockResolvedValue(makeClassifier()),
        warmup: vi.fn().mockResolvedValue(undefined),
      });

      const first = renderHook(() => useModelLoader(true, onError, localLoaders()));
      await act(async () => vi.dynamicImportSettled());
      expect(loadMobileNetEmbedding).toHaveBeenCalledOnce();
      const signal = loadMobileNetEmbedding.mock.calls[0][0] as AbortSignal;
      first.unmount();
      expect(signal.aborted).toBe(true);

      const second = renderHook(() => useModelLoader(true, onError, localLoaders()));
      await act(async () => vi.dynamicImportSettled());
      expect(loadMobileNetEmbedding).toHaveBeenCalledOnce();
      expect(second.result.current.isModelLoading).toBe(true);

      await act(async () => pending.resolve(oldModel));
      expect(oldModel.dispose).toHaveBeenCalledOnce();
      expect(loadMobileNetEmbedding).toHaveBeenCalledTimes(2);
      expect(second.result.current.mobilenetModel).toBe(newModel);
      expect(onError).not.toHaveBeenCalled();
    });

    it('retires the loaded graph after an unfinished GPU warmup settles', async () => {
      const classifier = makeClassifier();
      const model = makeFeatureExtractor();
      const warmup = Promise.withResolvers<void>();
      const loaders = makeSuccessfulLoaderFns(classifier, model);
      loaders.warmup = vi.fn(() => warmup.promise);
      const { result, unmount } = renderHook(() => useModelLoader(true, onError, loaders));
      await act(async () => {});
      expect(loaders.warmup).toHaveBeenCalledWith(model, expect.any(AbortSignal));
      expect(result.current.mobilenetModel).toBeNull();

      unmount();
      expect(model.dispose).not.toHaveBeenCalled();
      await act(async () => warmup.resolve());
      expect(model.dispose).toHaveBeenCalledOnce();
      expect(classifier.dispose).toHaveBeenCalledOnce();
      expect(onError).not.toHaveBeenCalled();
    });

    it('disposes models and the latest replacement classifier on unmount', async () => {
      const initial = makeClassifier();
      const replacement = makeClassifier();
      const model = { ...makeFeatureExtractor(), dispose: vi.fn() };
      const { result, unmount } = renderHook(() =>
        useModelLoader(true, onError, makeSuccessfulLoaderFns(initial, model)),
      );
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      act(() => result.current.setClassifier(replacement));
      expect(initial.dispose).toHaveBeenCalledOnce();
      unmount();
      expect(replacement.dispose).toHaveBeenCalledOnce();
      expect(model.dispose).toHaveBeenCalledOnce();
    });

    it('disposes a model that resolves after leaving the training page', async () => {
      const classifier = makeClassifier();
      const model = { ...makeFeatureExtractor(), dispose: vi.fn() };
      let finish!: (model: FeatureExtractor) => void;
      const loaders = makeSuccessfulLoaderFns(classifier, model);
      loaders.loadFeatureExtractor = vi.fn(
        () =>
          new Promise<FeatureExtractor>((resolve) => {
            finish = resolve;
          }),
      );
      const { unmount } = renderHook(() => useModelLoader(true, onError, loaders));
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      unmount();
      await act(async () => {
        finish(model);
      });
      expect(model.dispose).toHaveBeenCalledOnce();
      expect(classifier.dispose).toHaveBeenCalledOnce();
      expect(onError).not.toHaveBeenCalled();
    });
    /**
     * Verifies that the AbortSignal passed to loader functions prevents
     * onError from firing when the component unmounts mid-load. A pending
     * backend promise is held open until after unmount, then resolved — the
     * hook must check signal.aborted and swallow the resulting error.
     */
    it('ruft onError nicht auf wenn nach Unmount ein Fehler auftritt', async () => {
      let resolveBackend!: () => void;
      const backendPromise = new Promise<void>((resolve) => {
        resolveBackend = resolve;
      });

      const loaderFns: ModelLoaderFunctions = {
        initBackend: vi.fn(async (_setLoadingText, signal) => {
          await backendPromise;
          if (signal.aborted) throw signal.reason as Error;
        }),
        createClassifier: vi.fn().mockRejectedValue(new Error('sollte nicht aufgerufen werden')),
        loadFeatureExtractor: vi.fn(),
      };

      const { unmount } = renderHook(() => useModelLoader(true, onError, loaderFns));

      // Unmount before loading completes
      unmount();

      // Resolve the backend promise after unmount
      resolveBackend();

      await act(async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      });

      expect(onError).not.toHaveBeenCalled();
    });
  });
});
