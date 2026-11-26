/** Loads browser ML code and model weights only after explicit consent. */
import { useState, useEffect, useRef, useCallback, useEffectEvent } from 'react';
import { ML, MODEL_LOAD_RETRY } from '../constants';
import {
  acquireWebGlBackend,
  createClassifier,
  loadClassifierModule,
  loadTensorFlow,
  retainBackendWork,
  retireModel,
} from '../lib/ml-runtime';
import type { ErrorCategory } from '../types/errors';
import type { Classifier, FeatureExtractor } from '../types/ml-models';

interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
}

/** Sequential retries; an aborted or timed-out request is never duplicated. */
async function loadWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
  signal: AbortSignal,
): Promise<T> {
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    signal.throwIfAborted();
    try {
      return await fn();
    } catch (error) {
      signal.throwIfAborted();
      if (
        attempt === options.maxAttempts ||
        (error instanceof DOMException && error.name === 'TimeoutError')
      )
        throw error;
      await new Promise<void>((resolve, reject) => {
        const abort = () => {
          clearTimeout(timer);
          reject(signal.reason);
        };
        const timer = setTimeout(
          () => {
            signal.removeEventListener('abort', abort);
            resolve();
          },
          options.baseDelayMs * 2 ** (attempt - 1),
        );
        signal.addEventListener('abort', abort, { once: true });
      });
    }
  }
  throw new Error('No model load attempts configured.');
}

type LoadingStep<T> = (setText: (text: string) => void, signal: AbortSignal) => Promise<T>;

type MobileNetLoader = (signal: AbortSignal) => Promise<FeatureExtractor>;
let pendingModelLoad: Promise<FeatureExtractor> | undefined;

async function loadWhenIdle(load: MobileNetLoader, signal: AbortSignal) {
  // An already-started GPU warmup cannot be cancelled. Do not start another
  // graph download until the abandoned attempt has finished releasing it.
  while (pendingModelLoad) {
    await pendingModelLoad.catch(() => {});
    signal.throwIfAborted();
  }
  signal.throwIfAborted();
  pendingModelLoad = load(signal);
  try {
    return await pendingModelLoad;
  } finally {
    pendingModelLoad = undefined;
  }
}

/** Bound the loading attempt while allowing an already-started GPU read to finish safely. */
function loadModelWithDeadline(
  loadModel: MobileNetLoader,
  parent: AbortSignal,
): Promise<FeatureExtractor> {
  const controller = new AbortController();
  const signal = AbortSignal.any([parent, controller.signal]);
  return new Promise((resolve, reject) => {
    let finished = false;
    const finish = () => {
      finished = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      controller.abort();
    };
    const abort = () => {
      finish();
      reject(signal.reason);
    };
    const timer = setTimeout(
      () => controller.abort(new DOMException('MobileNet load timed out', 'TimeoutError')),
      MODEL_LOAD_RETRY.LOAD_TIMEOUT_MS,
    );
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    const release = retainBackendWork();
    void loadWhenIdle(loadModel, signal)
      .then(
        (model) => {
          if (finished) {
            retireModel(model);
            return;
          }
          finish();
          resolve(model);
        },
        (error) => {
          if (finished) return;
          finish();
          reject(error);
        },
      )
      .finally(release);
  });
}

async function prepareClassifier(): Promise<LoadingStep<Classifier>> {
  const { create } = await loadClassifierModule();
  return async (setText, signal) => {
    setText('Das Bildtraining wird vorbereitet.');
    signal.throwIfAborted();
    return create();
  };
}

async function prepareMobileNet(): Promise<LoadingStep<FeatureExtractor>> {
  const { loadMobileNetEmbedding } = await import('../lib/mobilenet-embedding');
  return (setText, signal) => {
    setText('Das KI-Modell wird geladen.');
    return loadWithRetry(
      () => loadMobileNetEmbedding(signal),
      {
        maxAttempts: MODEL_LOAD_RETRY.MAX_ATTEMPTS,
        baseDelayMs: MODEL_LOAD_RETRY.BASE_DELAY_MS,
      },
      signal,
    );
  };
}

async function warmupKnnShaders(model: FeatureExtractor, signal: AbortSignal) {
  const tf = await loadTensorFlow();
  signal.throwIfAborted();
  const knn = await createClassifier();
  try {
    signal.throwIfAborted();
    const features = tf.tidy(() =>
      model.infer(tf.zeros([ML.FEATURE_CANVAS_SIZE, ML.FEATURE_CANVAS_SIZE, 3])),
    );
    try {
      knn.addExample(features, '0');
      knn.addExample(features, '1');
      await knn.predictClass(features);
    } finally {
      features.dispose();
    }
  } finally {
    knn.dispose();
  }
}

function loadAndWarmModel(
  load: LoadingStep<FeatureExtractor>,
  warmup: typeof warmupKnnShaders,
  setText: (text: string) => void,
): MobileNetLoader {
  return async (signal) => {
    const model = await load(setText, signal);
    try {
      signal.throwIfAborted();
      setText('Das KI-Modell wird vorbereitet.');
      await warmup(model, signal);
      signal.throwIfAborted();
      return model;
    } catch (error) {
      retireModel(model);
      throw error;
    }
  };
}

export interface ModelLoaderFunctions {
  initBackend: LoadingStep<void>;
  createClassifier: LoadingStep<Classifier>;
  loadFeatureExtractor: LoadingStep<FeatureExtractor>;
  warmup?: typeof warmupKnnShaders;
}

export function useModelLoader(
  hasConsented: boolean,
  onError: (category: Extract<ErrorCategory, 'model'>, msg: string) => void,
  loaderFns?: Partial<ModelLoaderFunctions>,
  attempt = 0,
) {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Das Bildtraining wird vorbereitet.');
  const [classifier, updateClassifier] = useState<Classifier | null>(null);
  const [mobilenetModel, setMobilenetModel] = useState<FeatureExtractor | null>(null);
  const classifierRef = useRef<Classifier | null>(null);
  const reportError = useEffectEvent(onError);
  const getLoaders = useEffectEvent(() => loaderFns);

  const setClassifier = useCallback((next: Classifier | null) => {
    const previous = classifierRef.current;
    if (previous === next) return;
    classifierRef.current = next;
    updateClassifier(next);
    if (previous) retireModel(previous);
  }, []);

  useEffect(() => {
    if (!hasConsented) return;
    const controller = new AbortController();
    const { signal } = controller;
    const loaders = getLoaders();
    const backend = loaders?.initBackend ? undefined : acquireWebGlBackend();
    let model: FeatureExtractor | null = null;
    let pendingClassifier: Classifier | null = null;
    const setText = (text: string) => {
      if (!signal.aborted) setLoadingText(text);
    };

    async function initModels() {
      const releaseWork = retainBackendWork();
      try {
        if (backend) setText('Das Bildtraining wird vorbereitet.');
        // Resources remain consent-gated. Only local code can load in parallel with backend setup.
        const [, loadClassifier, loadFeatureExtractor] = await Promise.all([
          backend?.ready ?? loaders?.initBackend?.(setText, signal),
          loaders?.createClassifier ?? prepareClassifier(),
          loaders?.loadFeatureExtractor ?? prepareMobileNet(),
        ]);
        signal.throwIfAborted();
        pendingClassifier = await loadClassifier(setText, signal);
        signal.throwIfAborted();
        const load = loadAndWarmModel(
          loadFeatureExtractor,
          loaders?.warmup ?? warmupKnnShaders,
          setText,
        );
        model = await loadModelWithDeadline(load, signal);
        signal.throwIfAborted();
        setClassifier(pendingClassifier);
        pendingClassifier = null;
        setMobilenetModel(model);
        setIsModelLoading(false);
      } catch {
        pendingClassifier?.dispose();
        pendingClassifier = null;
        if (model) retireModel(model);
        model = null;
        backend?.release?.();
        if (signal.aborted) return;
        reportError('model', 'Fehler beim Laden der KI-Modelle. Bitte lade die Seite neu.');
        setIsModelLoading(false);
      } finally {
        releaseWork?.();
      }
    }
    void initModels();
    return () => {
      controller.abort(new DOMException('Model loading cancelled', 'AbortError'));
      setClassifier(null);
      if (model) retireModel(model);
      backend?.release?.();
      setMobilenetModel(null);
      setIsModelLoading(true);
    };
  }, [hasConsented, setClassifier, attempt]);

  return { classifier, setClassifier, mobilenetModel, isModelLoading, loadingText };
}
