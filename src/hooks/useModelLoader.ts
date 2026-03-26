import { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';

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

        setLoadingText('Lade MobileNet (Feature Extractor)...');
        const mn = await mobilenet.load({ version: 2, alpha: 1.0 });
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
