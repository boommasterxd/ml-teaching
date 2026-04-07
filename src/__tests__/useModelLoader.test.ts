/**
 * useModelLoader.test.ts
 *
 * Unit tests for the useModelLoader hook. Uses the optional loaderFns DI
 * parameter to inject stubs instead of real TF.js / network calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModelLoader } from '../hooks/useModelLoader';
import type { ModelLoaderFunctions } from '../hooks/useModelLoader';
import type { Classifier, FeatureExtractor } from '../types/ml-models';

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
    clearAllClasses: vi.fn(),
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
    // Suppress console.error output from expected error paths under test.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialer Zustand', () => {
    it('isModelLoading startet als true', () => {
      const { result } = renderHook(() =>
        useModelLoader(false, onError)
      );
      expect(result.current.isModelLoading).toBe(true);
    });

    it('classifier startet als null', () => {
      const { result } = renderHook(() =>
        useModelLoader(false, onError)
      );
      expect(result.current.classifier).toBeNull();
    });

    it('mobilenetModel startet als null', () => {
      const { result } = renderHook(() =>
        useModelLoader(false, onError)
      );
      expect(result.current.mobilenetModel).toBeNull();
    });
  });

  describe('Kein Laden ohne Consent', () => {
    it('bleibt im Ladezustand wenn hasConsented false ist', async () => {
      const loaderFns = makeSuccessfulLoaderFns(makeClassifier(), makeFeatureExtractor());
      const { result } = renderHook(() =>
        useModelLoader(false, onError, loaderFns)
      );

      // Wait for any potential async side effects
      await act(async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
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

      const { result } = renderHook(() =>
        useModelLoader(true, onError, loaderFns)
      );

      await act(async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.classifier).toBe(classifier);
      expect(result.current.mobilenetModel).toBe(featureExtractor);
    });

    it('setzt isModelLoading auf false nach erfolgreichem Laden', async () => {
      const loaderFns = makeSuccessfulLoaderFns(makeClassifier(), makeFeatureExtractor());

      const { result } = renderHook(() =>
        useModelLoader(true, onError, loaderFns)
      );

      await act(async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isModelLoading).toBe(false);
    });

    it('ruft alle drei Loader-Funktionen auf', async () => {
      const loaderFns = makeSuccessfulLoaderFns(makeClassifier(), makeFeatureExtractor());

      renderHook(() =>
        useModelLoader(true, onError, loaderFns)
      );

      await act(async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      });

      expect(loaderFns.initBackend).toHaveBeenCalledOnce();
      expect(loaderFns.createClassifier).toHaveBeenCalledOnce();
      expect(loaderFns.loadFeatureExtractor).toHaveBeenCalledOnce();
    });

    it('aktualisiert loadingText während der Ladeschritte', async () => {
      const loadingTexts: string[] = [];
      const classifier = makeClassifier();
      const featureExtractor = makeFeatureExtractor();

      const loaderFns: ModelLoaderFunctions = {
        initBackend: vi.fn(async (setLoadingText) => {
          setLoadingText('Backend...');
          loadingTexts.push('Backend...');
        }),
        createClassifier: vi.fn(async (setLoadingText) => {
          setLoadingText('KNN...');
          loadingTexts.push('KNN...');
          return classifier;
        }),
        loadFeatureExtractor: vi.fn(async (setLoadingText) => {
          setLoadingText('MobileNet...');
          loadingTexts.push('MobileNet...');
          return featureExtractor;
        }),
      };

      renderHook(() =>
        useModelLoader(true, onError, loaderFns)
      );

      await act(async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      });

      expect(loadingTexts).toEqual(['Backend...', 'KNN...', 'MobileNet...']);
    });
  });

  describe('Fehlerbehandlung', () => {
    it('ruft onError auf wenn initBackend fehlschlägt', async () => {
      const loaderFns: ModelLoaderFunctions = {
        initBackend: vi.fn().mockRejectedValue(new Error('Backend-Fehler')),
        createClassifier: vi.fn(),
        loadFeatureExtractor: vi.fn(),
      };

      renderHook(() =>
        useModelLoader(true, onError, loaderFns)
      );

      await act(async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      });

      expect(onError).toHaveBeenCalledWith('model', expect.any(String));
    });

    it('ruft onError auf wenn loadFeatureExtractor fehlschlägt', async () => {
      const loaderFns: ModelLoaderFunctions = {
        initBackend: vi.fn(async () => {}),
        createClassifier: vi.fn(async () => makeClassifier()),
        loadFeatureExtractor: vi.fn().mockRejectedValue(new Error('MobileNet-Fehler')),
      };

      renderHook(() =>
        useModelLoader(true, onError, loaderFns)
      );

      await act(async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      });

      expect(onError).toHaveBeenCalledWith('model', expect.any(String));
    });

    it('setzt isModelLoading auf false nach Fehler', async () => {
      const loaderFns: ModelLoaderFunctions = {
        initBackend: vi.fn().mockRejectedValue(new Error('Fehler')),
        createClassifier: vi.fn(),
        loadFeatureExtractor: vi.fn(),
      };

      const { result } = renderHook(() =>
        useModelLoader(true, onError, loaderFns)
      );

      await act(async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isModelLoading).toBe(false);
    });
  });

  describe('Abort bei Unmount', () => {
    /**
     * Verifies that the AbortSignal passed to loader functions prevents
     * onError from firing when the component unmounts mid-load. A pending
     * backend promise is held open until after unmount, then resolved — the
     * hook must check signal.aborted and swallow the resulting error.
     */
    it('ruft onError nicht auf wenn nach Unmount ein Fehler auftritt', async () => {
      let resolveBackend!: () => void;
      const backendPromise = new Promise<void>(resolve => { resolveBackend = resolve; });

      const loaderFns: ModelLoaderFunctions = {
        initBackend: vi.fn(async (_setLoadingText, signal) => {
          await backendPromise;
          if (signal.aborted) throw signal.reason as Error;
        }),
        createClassifier: vi.fn().mockRejectedValue(new Error('sollte nicht aufgerufen werden')),
        loadFeatureExtractor: vi.fn(),
      };

      const { unmount } = renderHook(() =>
        useModelLoader(true, onError, loaderFns)
      );

      // Unmount before loading completes
      unmount();

      // Resolve the backend promise after unmount
      resolveBackend();

      await act(async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      });

      expect(onError).not.toHaveBeenCalled();
    });
  });
});
