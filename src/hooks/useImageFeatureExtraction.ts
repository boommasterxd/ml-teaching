/**
 * useImageFeatureExtraction.ts
 *
 * React hook that extracts MobileNet feature vectors from a video or image
 * source and generates a square JPEG thumbnail. Encapsulates all canvas
 * and TensorFlow tensor operations, including proper tensor disposal.
 */
import { useRef, useCallback, useEffect } from 'react';
import type * as tf from '@tensorflow/tfjs-core';
import { loadTensorFlow, retainModel } from '../lib/ml-runtime';
import { drawFeatureFrame } from '../lib/feature-frame';
import type { MLImage } from '../types/ml';
import { ML } from '../constants';
import type { FeatureExtractor } from '../types/ml-models';

/** One active GPU extraction; uploads wait while disposable camera frames are dropped. */
function useExtractionQueue() {
  const busyRef = useRef(false);
  const waitingRef = useRef<Array<(acquired: boolean) => void>>([]);
  const acquire = useCallback(async (wait: boolean): Promise<boolean> => {
    if (!busyRef.current) {
      busyRef.current = true;
      return true;
    }
    if (!wait) return false;
    if (waitingRef.current.length >= ML.MAX_CLASSES)
      throw new Error('Image extraction queue is full.');
    return new Promise((resolve) => {
      waitingRef.current.push(resolve);
    });
  }, []);
  const release = useCallback(() => {
    const next = waitingRef.current.shift();
    if (next) next(true);
    else busyRef.current = false;
  }, []);
  useEffect(
    () => () => {
      waitingRef.current.splice(0).forEach((resolve) => resolve(false));
    },
    [],
  );
  return { acquire, release };
}

/**
 * Provides an `extractFeatures` function that converts a video or image
 * frame into an `MLImage` containing a feature vector and a thumbnail.
 *
 * @param mobilenetModel - The loaded MobileNet model used for feature
 *   extraction, or `null` if the model has not been loaded yet.
 * @returns An object with the `extractFeatures` callback.
 */
export function useImageFeatureExtraction(mobilenetModel: FeatureExtractor | null) {
  const thumbnailCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const { acquire, release } = useExtractionQueue();
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      thumbnailCanvasRef.current = null;
    };
  }, []);

  /**
   * Extracts a MobileNet embedding and generates a square thumbnail from
   * a video or image element.
   *
   * The source is center-cropped to a square before being drawn onto the
   * thumbnail canvas. When `mirror` is true the canvas transform is flipped
   * horizontally — matching the mirrored preview of a front-facing camera.
   *
   * All intermediate TensorFlow tensors are disposed in the `finally` block
   * to prevent memory leaks regardless of whether extraction succeeds.
   *
   * @param source - The `HTMLVideoElement` or `HTMLImageElement` to process.
   * @param mirror - Whether to flip the thumbnail horizontally.
   * @param waitForTurn - Queue selected uploads; camera frames use the default drop-if-busy mode.
   * @returns A resolved `MLImage` with a unique id, a JPEG data URL, and the
   *   raw feature array, or `null` if the model is not loaded or the source
   *   has zero dimensions.
   */
  const extractFeatures = useCallback(
    async (
      source: HTMLVideoElement | HTMLImageElement,
      mirror: boolean,
      waitForTurn = false,
    ): Promise<MLImage | null> => {
      if (!mobilenetModel || !mountedRef.current) return null;

      if (!(await acquire(waitForTurn))) return null;
      let releaseModel: (() => void) | undefined;
      let img: tf.Tensor | null = null;
      let features: tf.Tensor | null = null;

      try {
        if (!mountedRef.current) return null;
        const runtime = await loadTensorFlow();
        if (!mountedRef.current) return null;
        releaseModel = retainModel(mobilenetModel);
        if (!releaseModel) return null;
        thumbnailCanvasRef.current ??= document.createElement('canvas');
        const canvas = thumbnailCanvasRef.current;
        if (!drawFeatureFrame(source, canvas, mirror)) return null;
        img = runtime.browser.fromPixels(canvas);
        features = mobilenetModel.infer(img);
        const featureArray = Array.from(await features.data()) as number[];
        if (!mountedRef.current) return null;

        const dataUrl = canvas.toDataURL('image/jpeg', ML.THUMBNAIL_QUALITY);

        return {
          id: `img-${crypto.randomUUID()}`,
          dataUrl,
          featureArray,
        };
      } finally {
        img?.dispose();
        if (features) features.dispose();
        releaseModel?.();
        release();
      }
    },
    [mobilenetModel, acquire, release],
  );

  return { extractFeatures };
}
