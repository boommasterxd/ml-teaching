/**
 * usePredictionLoop.ts
 *
 * Hook that runs a real-time prediction loop using requestAnimationFrame,
 * classifying webcam frames through MobileNet + KNN at a throttled frame rate
 * defined by PREDICTION.INTERVAL_MS. Exposes start/stop controls and the
 * latest prediction result as reactive state.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import type React from 'react';
import * as tf from '@tensorflow/tfjs';
import type { Prediction } from '../types/ml';
import { PREDICTION } from '../constants';
import type { Classifier, FeatureExtractor } from '../types/ml-models';
import type { ErrorCategory } from '../types/errors';

/**
 * Extracts MobileNet features from the current video frame, runs KNN inference,
 * and updates the prediction state. Disposes both tensors in a finally-block
 * to prevent GPU memory leaks even when predictClass throws.
 *
 * @returns `true` on success, `false` on error.
 */
async function runInference(
  classifier: Classifier,
  mobilenetModel: FeatureExtractor,
  video: HTMLVideoElement,
  setPrediction: (p: Prediction) => void,
): Promise<boolean> {
  const img = tf.browser.fromPixels(video);
  const features = mobilenetModel.infer(img, true);
  try {
    const result = await classifier.predictClass(features);
    setPrediction({ label: result.label, confidences: result.confidences });
    return true;
  } catch (err) {
    console.error('Prediction error:', err);
    return false;
  } finally {
    img.dispose();
    features.dispose();
  }
}

/**
 * Runs a throttled prediction loop that continuously classifies video frames.
 *
 * On each animation frame the hook checks whether enough time has passed
 * (PREDICTION.INTERVAL_MS) before extracting MobileNet features from the
 * current video frame and passing them to the KNN classifier. Tensor memory
 * is always freed in a finally-block to prevent GPU memory leaks.
 *
 * The loop is started and stopped via the returned callbacks. When stopped,
 * the last prediction is cleared.
 *
 * After PREDICTION.MAX_CONSECUTIVE_ERRORS consecutive inference failures the
 * loop stops automatically and reports an error via `onError`.
 *
 * @param classifier - Trained KNN classifier. Pass null while the model is not yet ready.
 * @param mobilenetModel - Loaded MobileNet instance used for feature extraction.
 * @param videoRef - Ref to the video element providing the webcam stream.
 * @param onError - Called with category `'prediction'` when the loop stops due to repeated errors.
 * @returns An object with the following fields:
 *   - `prediction` (`Prediction | null`) — the most recent classification result,
 *     containing `label` and `confidences`. Resets to `null` when the loop stops.
 *   - `isPredicting` — whether the prediction loop is currently running.
 *   - `startPredicting` — callback that activates the loop.
 *   - `stopPredicting` — callback that deactivates the loop and clears `prediction`.
 */
export function usePredictionLoop(
  classifier: Classifier | null,
  mobilenetModel: FeatureExtractor | null,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onError: (category: Extract<ErrorCategory, 'prediction'>, msg: string) => void,
) {
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const requestRef = useRef<number>(undefined);
  const shouldPredictRef = useRef(false);
  const lastPredictTimeRef = useRef(0);
  const consecutiveErrorRef = useRef(0);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    /**
     * Single iteration of the prediction loop, scheduled via requestAnimationFrame.
     *
     * Guard conditions: exits immediately when the classifier, MobileNet model,
     * or video element is unavailable, or when no classes have been trained yet.
     *
     * Throttling: compares `timestamp` against `lastPredictTimeRef` and re-queues
     * the next frame without running inference if less than PREDICTION.INTERVAL_MS
     * have elapsed — keeping the effective rate at roughly 15 FPS regardless of
     * the display refresh rate.
     *
     * @param timestamp - DOMHighResTimeStamp provided by requestAnimationFrame.
     */
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
        videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        videoRef.current.videoWidth > 0 &&
        videoRef.current.videoHeight > 0
      ) {
        const success = await runInference(classifier, mobilenetModel, videoRef.current, setPrediction);
        if (success) {
          consecutiveErrorRef.current = 0;
        } else {
          consecutiveErrorRef.current += 1;
          if (consecutiveErrorRef.current >= PREDICTION.MAX_CONSECUTIVE_ERRORS) {
            onErrorRef.current('prediction', 'Die Klassifizierung ist wiederholt fehlgeschlagen. Bitte trainiere das Modell erneut.');
            setIsPredicting(false);
            return;
          }
        }
      }

      if (shouldPredictRef.current) {
        requestRef.current = requestAnimationFrame(predictLoop);
      }
    };

    shouldPredictRef.current = isPredicting;
    if (isPredicting) {
      lastPredictTimeRef.current = 0;
      consecutiveErrorRef.current = 0;
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
  }, [isPredicting, classifier, mobilenetModel]);

  /**
   * Sets `isPredicting` to `true`, which triggers the `useEffect` to reset the
   * timestamp reference and schedule the first `predictLoop` frame via
   * requestAnimationFrame.
   */
  const startPredicting = useCallback(() => {
    setIsPredicting(true);
  }, []);

  /**
   * Sets `isPredicting` to `false`, which causes the `useEffect` to cancel the
   * pending requestAnimationFrame handle and reset `prediction` to `null`.
   * The `shouldPredictRef` guard inside `predictLoop` prevents any in-flight
   * frame from re-queuing itself after the effect re-runs.
   */
  const stopPredicting = useCallback(() => {
    setIsPredicting(false);
  }, []);

  return { prediction, isPredicting, startPredicting, stopPredicting };
}
