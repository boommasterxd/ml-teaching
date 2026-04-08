/**
 * Hook that loads TensorFlow.js, MobileNet, and the KNN classifier once the user consents.
 * Includes retry logic with exponential backoff for network-dependent model loading.
 * Uses an AbortSignal to cancel pending retries on unmount or consent change.
 */
import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import { ML, MODEL_LOAD_RETRY } from '../constants';
import type { ErrorCategory } from '../types/errors';
import type { Classifier, FeatureExtractor } from '../types/ml-models';

// Module-level cache: MobileNet is re-used across in-app resets without re-downloading.
// Cleared on page reload (JS context reset), but TF.js IndexedDB cache prevents re-download anyway.
let cachedMobilenet: FeatureExtractor | null = null;
let tfBackendInitialized = false;

/**
 * Configuration options for `loadWithRetry`.
 */
export interface RetryOptions {
  /** Maximum number of attempts before re-throwing the last error. */
  maxAttempts: number;
  /** Base delay in milliseconds; doubled on each successive attempt (exponential backoff). */
  baseDelayMs: number;
}

/**
 * Retries an async operation with exponential backoff until it succeeds or the
 * maximum number of attempts is reached. Aborts cleanly when the provided
 * AbortSignal fires, rejecting the delay promise immediately.
 *
 * @param fn - Async factory that performs the operation to retry.
 * @param options - Retry configuration: `maxAttempts` and `baseDelayMs`.
 * @param signal - AbortSignal used to cancel any pending retry delay.
 * @returns The resolved value of `fn` on the first successful attempt.
 * @throws The last error thrown by `fn`, or the abort reason if the signal fires.
 */
export async function loadWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
  signal: AbortSignal,
): Promise<T> {
  const { maxAttempts, baseDelayMs } = options;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    signal.throwIfAborted();
    try {
      return await fn();
    } catch (err) {
      if (signal.aborted) throw signal.reason as Error;
      if (attempt === maxAttempts) throw err;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, baseDelayMs * Math.pow(2, attempt - 1));
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(signal.reason);
        }, { once: true });
      });
    }
  }
  throw new Error('Unreachable');
}

/**
 * Initializes the TensorFlow.js WebGL backend and waits until it is ready.
 *
 * @param setLoadingText - Callback to update the human-readable loading status string.
 * @param signal - AbortSignal used to cancel the initialization if consent is revoked or the component unmounts.
 */
async function initTfBackend(
  setLoadingText: (text: string) => void,
  signal: AbortSignal,
): Promise<void> {
  if (tfBackendInitialized) return;
  setLoadingText('Lade TensorFlow.js Backend...');
  await tf.setBackend('webgl');
  await tf.ready();
  if (signal.aborted) throw signal.reason as Error;
  tfBackendInitialized = true;
}

/**
 * Creates a new KNN classifier instance.
 *
 * @param setLoadingText - Callback to update the human-readable loading status string.
 * @param signal - AbortSignal used to cancel the operation if consent is revoked or the component unmounts.
 * @returns The created KNN classifier.
 */
async function createKnnClassifier(
  setLoadingText: (text: string) => void,
  signal: AbortSignal,
): Promise<Classifier> {
  setLoadingText('Erstelle KNN Klassifikator...');
  const knn = knnClassifier.create();
  if (signal.aborted) throw signal.reason as Error;
  return knn;
}

/**
 * Downloads and initializes the MobileNet feature extractor with retry logic.
 *
 * @param setLoadingText - Callback to update the human-readable loading status string.
 * @param signal - AbortSignal forwarded to `loadWithRetry` to abort pending retry delays.
 * @returns The loaded MobileNet instance.
 */
async function loadMobileNet(
  setLoadingText: (text: string) => void,
  signal: AbortSignal,
): Promise<FeatureExtractor> {
  if (cachedMobilenet) return cachedMobilenet;
  const model = await loadWithRetry(
    async () => {
      if (signal.aborted) throw signal.reason as Error;
      setLoadingText('Lade MobileNet (Feature Extractor)...');
      return Promise.race([
        mobilenet.load({
          version: ML.MOBILENET_VERSION,
          alpha: ML.MOBILENET_ALPHA,
        }),
        new Promise<never>((_, reject) => {
          const timer = setTimeout(
            () => reject(new Error('MobileNet load timed out')),
            MODEL_LOAD_RETRY.LOAD_TIMEOUT_MS,
          );
          signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
        }),
      ]);
    },
    { maxAttempts: MODEL_LOAD_RETRY.MAX_ATTEMPTS, baseDelayMs: MODEL_LOAD_RETRY.BASE_DELAY_MS },
    signal,
  );
  cachedMobilenet = model;
  return model;
}

/**
 * Pre-compiles WebGL shaders for the KNN training and prediction operations by running
 * a dummy forward pass through MobileNet + KNN. Without this warmup, shader compilation
 * happens on the user's first training run, causing visible UI lag. After warmup the
 * compiled shaders are cached in the WebGL context and all subsequent calls are fast.
 *
 * Uses `tf.tidy` to ensure all intermediate tensors are freed automatically.
 *
 * @param model - The already-loaded MobileNet instance.
 * @param signal - AbortSignal to cancel the warmup if consent is revoked or the component unmounts.
 */
async function warmupKnnShaders(model: FeatureExtractor, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return;
  const dummyClassifier = knnClassifier.create();
  try {
    // Run two dummy examples (two different class IDs) so that predictClass has
    // at least one example per class and compiles the full distance-computation path.
    for (let classId = 0; classId < 2; classId++) {
      const features = tf.tidy(() => {
        const dummyImg = tf.zeros([224, 224, 3]) as tf.Tensor3D;
        return model.infer(dummyImg, true);
      });
      dummyClassifier.addExample(features, String(classId));
      features.dispose();
    }
    if (signal.aborted) return;
    // Trigger predictClass to compile the distance-computation shaders.
    const dummyInput = tf.tidy(() => {
      const img = tf.zeros([224, 224, 3]) as tf.Tensor3D;
      return model.infer(img, true);
    });
    try {
      await dummyClassifier.predictClass(dummyInput);
    } finally {
      dummyInput.dispose();
    }
  } finally {
    dummyClassifier.dispose();
  }
}

/**
 * Optional dependency-injection interface for the three model-loading steps.
 * Provide this in tests to avoid real TF.js / network calls.
 */
export interface ModelLoaderFunctions {
  initBackend: typeof initTfBackend;
  createClassifier: typeof createKnnClassifier;
  loadFeatureExtractor: typeof loadMobileNet;
}

/**
 * Loads and initializes the TensorFlow.js WebGL backend, a KNN classifier, and
 * the MobileNet v2 feature extractor once the user has given consent. Exposes
 * loading state and the ready model instances to the caller.
 *
 * @param hasConsented - When `true`, triggers the model loading sequence.
 *   Setting this back to `false` aborts any in-progress load.
 * @param onError - Called with category `'model'` and a human-readable message
 *   if any step of the loading sequence fails permanently.
 * @param loaderFns - Optional overrides for the three loading steps; intended
 *   for unit tests to inject stubs instead of real TF.js / network calls.
 * @returns An object containing:
 *   - `classifier` — the KNN classifier instance, or `null` while loading.
 *   - `setClassifier` — state setter to reset or replace the classifier externally.
 *   - `mobilenetModel` — the loaded MobileNet instance, or `null` while loading.
 *   - `isModelLoading` — `true` until all models are ready or an error occurred.
 *   - `loadingText` — human-readable status string describing the current loading step.
 */
export function useModelLoader(
  hasConsented: boolean,
  onError: (category: Extract<ErrorCategory, 'model'>, msg: string) => void,
  loaderFns?: Partial<ModelLoaderFunctions>,
) {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Initialisiere TensorFlow.js...');
  const [classifier, setClassifier] = useState<Classifier | null>(null);
  const [mobilenetModel, setMobilenetModel] = useState<FeatureExtractor | null>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Keep loaderFns in a ref so the effect always calls the latest injected
  // functions without needing loaderFns in the dependency array. Adding an
  // object to deps would cause infinite re-runs if the caller passes an inline
  // object literal on every render.
  const loaderFnsRef = useRef(loaderFns);
  loaderFnsRef.current = loaderFns;

  useEffect(() => {
    if (!hasConsented) return;

    const controller = new AbortController();
    const { signal } = controller;

    const _initBackend = loaderFnsRef.current?.initBackend ?? initTfBackend;
    const _createClassifier = loaderFnsRef.current?.createClassifier ?? createKnnClassifier;
    const _loadFeatureExtractor = loaderFnsRef.current?.loadFeatureExtractor ?? loadMobileNet;

    async function initModels() {
      try {
        await _initBackend(setLoadingText, signal);
        if (signal.aborted) return;

        const knn = await _createClassifier(setLoadingText, signal);
        if (signal.aborted) return;
        setClassifier(knn);

        const mn = await _loadFeatureExtractor(setLoadingText, signal);
        if (signal.aborted) return;
        setMobilenetModel(mn);

        setLoadingText('Optimiere GPU-Performance...');
        await warmupKnnShaders(mn, signal);
        if (signal.aborted) return;

        setIsModelLoading(false);
      } catch (err) {
        if (signal.aborted) return;
        console.error('Error loading models:', err);
        onErrorRef.current('model', 'Fehler beim Laden der KI-Modelle. Bitte lade die Seite neu.');
        setIsModelLoading(false);
      }
    }

    initModels();

    return () => {
      controller.abort(new DOMException('Model loading cancelled', 'AbortError'));
    };
  }, [hasConsented]);

  return { classifier, setClassifier, mobilenetModel, isModelLoading, loadingText };
}
