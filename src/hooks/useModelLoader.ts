/**
 * Hook that loads TensorFlow.js, MobileNet, and the KNN classifier once the user consents.
 * Includes retry logic with exponential backoff for network-dependent model loading.
 * Uses an AbortSignal to cancel pending retries on unmount or consent change.
 */
import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import { ML, MODEL_LOAD_RETRY } from '../constants';

/** Retries an async operation with exponential backoff. Aborts cleanly via signal. */
async function loadWithRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  baseDelayMs: number,
  signal: AbortSignal,
): Promise<T> {
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

/** Initializes the ML backend, creates a KNN classifier, and loads MobileNet v2. */
export function useModelLoader(
  hasConsented: boolean,
  onError: (msg: string) => void
) {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Initialisiere TensorFlow.js...');
  const [classifier, setClassifier] = useState<knnClassifier.KNNClassifier | null>(null);
  const [mobilenetModel, setMobilenetModel] = useState<mobilenet.MobileNet | null>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!hasConsented) return;

    const controller = new AbortController();
    const { signal } = controller;

    async function initModels() {
      try {
        setLoadingText('Lade TensorFlow.js Backend...');
        await tf.ready();
        if (signal.aborted) return;

        setLoadingText('Erstelle KNN Klassifikator...');
        const knn = knnClassifier.create();
        if (signal.aborted) return;
        setClassifier(knn);

        const mn = await loadWithRetry(
          async () => {
            if (signal.aborted) throw signal.reason as Error;
            setLoadingText('Lade MobileNet (Feature Extractor)...');
            return mobilenet.load({
              version: ML.MOBILENET_VERSION,
              alpha: ML.MOBILENET_ALPHA,
            });
          },
          MODEL_LOAD_RETRY.MAX_ATTEMPTS,
          MODEL_LOAD_RETRY.BASE_DELAY_MS,
          signal,
        );
        if (signal.aborted) return;
        setMobilenetModel(mn);

        setIsModelLoading(false);
      } catch (err) {
        if (signal.aborted) return;
        console.error('Error loading models:', err);
        onErrorRef.current('Fehler beim Laden der KI-Modelle. Bitte lade die Seite neu.');
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
