/**
 * Hook that runs a real-time prediction loop using requestAnimationFrame,
 * classifying webcam frames through MobileNet + KNN.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import type React from 'react';
import * as tf from '@tensorflow/tfjs';
import type * as mobilenet from '@tensorflow-models/mobilenet';
import type * as knnClassifier from '@tensorflow-models/knn-classifier';
import type { Prediction } from '../types/ml';
import { PREDICTION } from '../constants';

/** Continuously classifies video frames and exposes start/stop controls. */
export function usePredictionLoop(
  classifier: knnClassifier.KNNClassifier | null,
  mobilenetModel: mobilenet.MobileNet | null,
  videoRef: React.RefObject<HTMLVideoElement | null>
) {
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const requestRef = useRef<number>(undefined);
  const shouldPredictRef = useRef(false);
  const lastPredictTimeRef = useRef(0);

  // Local prediction function — captures current values via closure.
  // Recreated in the effect when classifier or mobilenetModel changes.
  const predictLoop = async (timestamp: number) => {
    if (!classifier || !mobilenetModel || !videoRef.current || classifier.getNumClasses() === 0) {
      return;
    }

    if (timestamp - lastPredictTimeRef.current < PREDICTION.INTERVAL_MS) {
      if (shouldPredictRef.current) {
        requestRef.current = requestAnimationFrame(predictLoop);
      }
      return;
    }
    lastPredictTimeRef.current = timestamp;

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
      lastPredictTimeRef.current = 0;
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

  /** Activates the prediction loop. */
  const startPredicting = useCallback(() => {
    setIsPredicting(true);
  }, []);

  /** Stops the prediction loop and clears the last result. */
  const stopPredicting = useCallback(() => {
    setIsPredicting(false);
  }, []);

  return { prediction, isPredicting, startPredicting, stopPredicting };
}
