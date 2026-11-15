/**
 * usePredictionLoop.ts
 *
 * Hook that runs a real-time prediction loop using requestAnimationFrame,
 * classifying webcam frames through MobileNet + KNN at a throttled frame rate
 * defined by PREDICTION.INTERVAL_MS. Exposes start/stop controls and the
 * latest prediction result as reactive state.
 */
import { useState, useEffect, useRef, useCallback, useEffectEvent } from 'react';
import type React from 'react';
import type * as tf from '@tensorflow/tfjs-core';
import { loadTensorFlow } from '../lib/ml-runtime';
import { drawFeatureFrame } from '../lib/feature-frame';
import type { Prediction } from '../types/ml';
import { PREDICTION } from '../constants';
import type { Classifier, FeatureExtractor } from '../types/ml-models';
import type { ErrorCategory } from '../types/errors';

/**
 * Groups the three ML objects that are always passed together into inference
 * functions, eliminating the recurring Data Clump.
 */
interface InferenceContext {
  classifier: Classifier;
  mobilenetModel: FeatureExtractor;
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  mirror: boolean;
}

/**
 * Returns `true` when the video element has buffered at least one full frame
 * and has non-zero dimensions — safe to pass to `tf.browser.fromPixels`.
 */
function isVideoReady(video: HTMLVideoElement): boolean {
  return (
    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    video.videoWidth > 0 &&
    video.videoHeight > 0
  );
}

/**
 * Extracts MobileNet features from the current video frame, runs KNN inference,
 * and updates the prediction state. Disposes both tensors in a finally-block
 * to prevent GPU memory leaks even when predictClass throws.
 *
 * @returns `true` on success, `false` on error.
 */
async function runInference(
  ctx: InferenceContext,
  setPrediction: (p: Prediction) => void,
): Promise<boolean> {
  let img: tf.Tensor | null = null;
  let features: tf.Tensor | null = null;
  try {
    const runtime = await loadTensorFlow();
    if (!drawFeatureFrame(ctx.video, ctx.canvas, ctx.mirror)) return false;
    img = runtime.browser.fromPixels(ctx.canvas);
    features = ctx.mobilenetModel.infer(img, true);
    const result = await ctx.classifier.predictClass(features);
    setPrediction({ label: result.label, confidences: result.confidences });
    return true;
  } catch (err) {
    // Design decision: Individual prediction errors are intentionally only
    // logged here — the caller (handleInference) tracks consecutive failures
    // and escalates to onError after MAX_CONSECUTIVE_ERRORS, avoiding UI
    // disruption from transient single-frame failures in a 15 FPS loop.
    console.error('Prediction error:', err);
    return false;
  } finally {
    img?.dispose();
    features?.dispose();
  }
}

/**
 * Runs a single inference on the given video frame, updates the prediction state,
 * and tracks consecutive failures. Returns `'ok'` on success, `'error'` on a
 * recoverable failure, and `'fatal'` when MAX_CONSECUTIVE_ERRORS is reached.
 */
async function handleInference(
  ctx: InferenceContext,
  setPrediction: (p: Prediction) => void,
  consecutiveErrorRef: React.MutableRefObject<number>,
): Promise<'ok' | 'error' | 'fatal'> {
  const success = await runInference(ctx, setPrediction);
  if (success) {
    consecutiveErrorRef.current = 0;
    return 'ok';
  }
  consecutiveErrorRef.current += 1;
  return consecutiveErrorRef.current >= PREDICTION.MAX_CONSECUTIVE_ERRORS ? 'fatal' : 'error';
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
  mirror = false,
) {
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const requestRef = useRef<number>(undefined);
  const shouldPredictRef = useRef(false);
  const generationRef = useRef(0);
  const inferenceRunningRef = useRef(false);
  const lastPredictTimeRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reportError = useEffectEvent(onError);

  useEffect(() => {
    const generation = ++generationRef.current;
    const isCurrent = () => shouldPredictRef.current && generationRef.current === generation;
    const consecutiveErrorRef = { current: 0 };
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
      if (!isCurrent()) return;
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

      if (isVideoReady(videoRef.current) && !inferenceRunningRef.current && !document.hidden) {
        canvasRef.current ??= document.createElement('canvas');
        const ctx: InferenceContext = {
          classifier,
          mobilenetModel,
          video: videoRef.current,
          canvas: canvasRef.current,
          mirror,
        };
        inferenceRunningRef.current = true;
        const result = await handleInference(
          ctx,
          (value) => {
            if (isCurrent()) setPrediction(value);
          },
          consecutiveErrorRef,
        );
        inferenceRunningRef.current = false;
        if (!isCurrent()) return;
        if (result === 'fatal') {
          reportError(
            'prediction',
            'Die Klassifizierung ist wiederholt fehlgeschlagen. Bitte trainiere das Modell erneut.',
          );
          setPrediction(null);
          setIsPredicting(false);
          return;
        }
      }

      if (isCurrent()) {
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
    }

    return () => {
      shouldPredictRef.current = false;
      canvasRef.current = null;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPredicting, classifier, mobilenetModel, videoRef, mirror]);

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
    shouldPredictRef.current = false;
    generationRef.current++;
    setPrediction(null);
    setIsPredicting(false);
  }, []);

  return { prediction, isPredicting, startPredicting, stopPredicting };
}
