/**
 * useImageFeatureExtraction.ts
 *
 * React hook that extracts MobileNet feature vectors from a video or image
 * source and generates a square JPEG thumbnail. Encapsulates all canvas
 * and TensorFlow tensor operations, including proper tensor disposal.
 */
import { useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import type { MLImage } from '../types/ml';
import { ML } from '../constants';
import type { FeatureExtractor } from '../types/ml-models';

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
   * @returns A resolved `MLImage` with a unique id, a JPEG data URL, and the
   *   raw feature array, or `null` if the model is not loaded or the source
   *   has zero dimensions.
   */
  const extractFeatures = useCallback(async (
    source: HTMLVideoElement | HTMLImageElement,
    mirror: boolean
  ): Promise<MLImage | null> => {
    if (!mobilenetModel) return null;

    const sourceWidth = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    const sourceHeight = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
    if (sourceWidth === 0 || sourceHeight === 0) return null;

    const img = tf.browser.fromPixels(source);
    let features: tf.Tensor | null = null;

    try {
      // `infer` with `true` returns the embedding from the penultimate layer.
      features = mobilenetModel.infer(img, true) as tf.Tensor;
      const featureArray = Array.from(await features.data()) as number[];

      // Lazily create the off-screen canvas and reuse it across calls.
      if (!thumbnailCanvasRef.current) {
        thumbnailCanvasRef.current = document.createElement('canvas');
        thumbnailCanvasRef.current.width = ML.FEATURE_CANVAS_SIZE;
        thumbnailCanvasRef.current.height = ML.FEATURE_CANVAS_SIZE;
      }
      const canvas = thumbnailCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Reset any transform from a previous call before applying a new one.
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Center-crop the source to a square region.
        const size = Math.min(sourceWidth, sourceHeight);
        const startX = (sourceWidth - size) / 2;
        const startY = (sourceHeight - size) / 2;

        if (mirror) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(source, startX, startY, size, size, 0, 0, canvas.width, canvas.height);
      }
      const dataUrl = canvas.toDataURL('image/jpeg', ML.THUMBNAIL_QUALITY);

      return {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? `img-${crypto.randomUUID()}`
          : `img-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        dataUrl,
        featureArray,
      };
    } finally {
      img.dispose();
      if (features) features.dispose();
    }
  }, [mobilenetModel]);

  return { extractFeatures };
}
