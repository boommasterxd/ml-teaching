import { useState, useEffect, useRef, useCallback } from 'react';
import type React from 'react';
import * as tf from '@tensorflow/tfjs';
import type * as mobilenet from '@tensorflow-models/mobilenet';
import type * as knnClassifier from '@tensorflow-models/knn-classifier';
import type { Prediction } from '../types/ml';

export function usePredictionLoop(
  classifier: knnClassifier.KNNClassifier | null,
  mobilenetModel: mobilenet.MobileNet | null,
  videoRef: React.RefObject<HTMLVideoElement | null>
) {
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const requestRef = useRef<number>(undefined);
  const shouldPredictRef = useRef(false);

  // Prediction-Loop als lokale Funktion – greift über Closure auf aktuelle Werte zu.
  // Wird im useEffect neu erzeugt, wenn sich classifier oder mobilenetModel ändern.
  const predictLoop = async () => {
    if (!classifier || !mobilenetModel || !videoRef.current || classifier.getNumClasses() === 0) {
      return;
    }

    if (
      videoRef.current.readyState >= 2 &&
      videoRef.current.videoWidth > 0 &&
      videoRef.current.videoHeight > 0
    ) {
      const img = tf.browser.fromPixels(videoRef.current);
      const features = mobilenetModel.infer(img, true);

      try {
        const result = await classifier.predictClass(features);
        setPrediction({
          label: result.label,
          confidences: result.confidences,
        });
      } catch (err) {
        console.error('Prediction error:', err);
      } finally {
        img.dispose();
        features.dispose();
      }
    }

    if (shouldPredictRef.current) {
      requestRef.current = requestAnimationFrame(predictLoop);
    }
  };

  useEffect(() => {
    shouldPredictRef.current = isPredicting;
    if (isPredicting) {
      requestRef.current = requestAnimationFrame(predictLoop);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      setPrediction(null);
    }

    return () => {
      shouldPredictRef.current = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPredicting, classifier, mobilenetModel]);

  const startPredicting = useCallback(() => {
    setIsPredicting(true);
  }, []);

  const stopPredicting = useCallback(() => {
    setIsPredicting(false);
  }, []);

  return { prediction, isPredicting, startPredicting, stopPredicting };
}
