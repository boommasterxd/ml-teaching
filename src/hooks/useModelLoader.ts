/** Loads browser ML code and model weights only after explicit consent. */
import { useState, useEffect, useRef, useCallback, useEffectEvent } from 'react';
import { ML, MODEL_LOAD_RETRY } from '../constants';
import {
  createClassifier,
  initializeBackend,
  loadClassifierModule,
  loadTensorFlow,
} from '../lib/ml-runtime';
import type { ErrorCategory } from '../types/errors';
import type { Classifier, FeatureExtractor } from '../types/ml-models';

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
}

/** Sequential retries; an aborted or timed-out request is never duplicated. */
export async function loadWithRetry<T>(
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

/** Dispose a late model after timeout/abort; MobileNet cannot cancel its network request. */
function awaitModel(
  load: Promise<FeatureExtractor>,
  signal: AbortSignal,
): Promise<FeatureExtractor> {
  return new Promise((resolve, reject) => {
    let finished = false;
    const finish = () => {
      finished = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
    };
    const abort = () => {
      finish();
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      finish();
      reject(new DOMException('MobileNet load timed out', 'TimeoutError'));
    }, MODEL_LOAD_RETRY.LOAD_TIMEOUT_MS);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    load.then(
      (model) => {
        if (finished) {
          model.dispose?.();
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
    );
  });
}

const initTfBackend: LoadingStep<void> = async (setText, signal) => {
  setText('Lade TensorFlow.js Backend...');
  await initializeBackend();
  signal.throwIfAborted();
};

async function prepareClassifier(): Promise<LoadingStep<Classifier>> {
  const { create } = await loadClassifierModule();
  return async (setText, signal) => {
    setText('Erstelle KNN Klassifikator...');
    signal.throwIfAborted();
    return create();
  };
}

async function prepareMobileNet(): Promise<LoadingStep<FeatureExtractor>> {
  const mobilenet = await import('@tensorflow-models/mobilenet');
  return (setText, signal) => {
    setText('Lade MobileNet (Feature Extractor)...');
    return loadWithRetry(
      () =>
        awaitModel(
          mobilenet.load({
            version: ML.MOBILENET_VERSION,
            alpha: ML.MOBILENET_ALPHA,
          }),
          signal,
        ),
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
    for (let classId = 0; classId < 2; classId++) {
      signal.throwIfAborted();
      const features = tf.tidy(() => model.infer(tf.zeros([224, 224, 3]), true));
      try {
        knn.addExample(features, String(classId));
      } finally {
        features.dispose();
      }
    }
    signal.throwIfAborted();
    const features = tf.tidy(() => model.infer(tf.zeros([224, 224, 3]), true));
    try {
      await knn.predictClass(features);
    } finally {
      features.dispose();
    }
  } finally {
    knn.dispose();
  }
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
) {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Initialisiere TensorFlow.js...');
  const [classifier, updateClassifier] = useState<Classifier | null>(null);
  const [mobilenetModel, setMobilenetModel] = useState<FeatureExtractor | null>(null);
  const classifierRef = useRef<Classifier | null>(null);
  const reportError = useEffectEvent(onError);
  const getLoaders = useEffectEvent(() => loaderFns);

  const setClassifier = useCallback((next: Classifier) => {
    const previous = classifierRef.current;
    classifierRef.current = next;
    updateClassifier(next);
    if (previous !== next) previous?.dispose();
  }, []);

  useEffect(() => {
    if (!hasConsented) return;
    const controller = new AbortController();
    const { signal } = controller;
    const loaders = getLoaders();
    let model: FeatureExtractor | null = null;
    let published = false;
    let pendingClassifier: Classifier | null = null;
    const setText = (text: string) => {
      if (!signal.aborted) setLoadingText(text);
    };

    async function initModels() {
      try {
        // Resources remain consent-gated. Only local code can load in parallel with backend setup.
        const [, loadClassifier, loadFeatureExtractor] = await Promise.all([
          (loaders?.initBackend ?? initTfBackend)(setText, signal),
          loaders?.createClassifier ?? prepareClassifier(),
          loaders?.loadFeatureExtractor ?? prepareMobileNet(),
        ]);
        signal.throwIfAborted();
        pendingClassifier = await loadClassifier(setText, signal);
        signal.throwIfAborted();
        model = await loadFeatureExtractor(setText, signal);
        signal.throwIfAborted();
        setText('Optimiere GPU-Performance...');
        await (loaders?.warmup ?? warmupKnnShaders)(model, signal);
        signal.throwIfAborted();
        setClassifier(pendingClassifier);
        pendingClassifier = null;
        published = true;
        setMobilenetModel(model);
        setIsModelLoading(false);
      } catch {
        pendingClassifier?.dispose();
        pendingClassifier = null;
        model?.dispose?.();
        model = null;
        if (signal.aborted) return;
        reportError('model', 'Fehler beim Laden der KI-Modelle. Bitte lade die Seite neu.');
        setIsModelLoading(false);
      }
    }
    void initModels();
    return () => {
      controller.abort(new DOMException('Model loading cancelled', 'AbortError'));
      classifierRef.current?.dispose();
      classifierRef.current = null;
      // The loader owns models only until publication. In-flight warmup owns its
      // tensors until it settles, then the aborted path disposes the model.
      if (published) {
        model?.dispose?.();
        model = null;
      }
      updateClassifier(null);
      setMobilenetModel(null);
      setIsModelLoading(true);
    };
  }, [hasConsented, setClassifier]);

  return { classifier, setClassifier, mobilenetModel, isModelLoading, loadingText };
}
