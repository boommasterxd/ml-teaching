/**
 * Hook that loads TensorFlow.js, MobileNet, and the KNN classifier once the user consents.
 * Includes retry logic with exponential backoff for network-dependent model loading.
 */
import { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import { ML, MODEL_LOAD_RETRY } from '../constants';

/** Retries an async operation with exponential backoff. */
async function loadWithRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  baseDelayMs: number,
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, attempt - 1)));
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

  useEffect(() => {
    if (!hasConsented) return;

    async function initModels() {
      try {
        setLoadingText('Lade TensorFlow.js Backend...');
        await tf.ready();

        setLoadingText('Erstelle KNN Klassifikator...');
        const knn = knnClassifier.create();
        setClassifier(knn);

        const mn = await loadWithRetry(
          async () => {
            setLoadingText('Lade MobileNet (Feature Extractor)...');
            return mobilenet.load({
              version: ML.MOBILENET_VERSION,
              alpha: ML.MOBILENET_ALPHA,
            });
          },
          MODEL_LOAD_RETRY.MAX_ATTEMPTS,
          MODEL_LOAD_RETRY.BASE_DELAY_MS,
        );
        setMobilenetModel(mn);

        setIsModelLoading(false);
      } catch (err) {
        console.error('Error loading models:', err);
        onError('Fehler beim Laden der KI-Modelle. Bitte lade die Seite neu.');
        setIsModelLoading(false);
      }
    }

    initModels();
  }, [hasConsented, onError]);

  return { classifier, setClassifier, mobilenetModel, isModelLoading, loadingText };
}
