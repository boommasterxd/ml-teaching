/**
 * Hook that extracts MobileNet features from an image/video source and
 * generates a thumbnail. Encapsulates all canvas and tensor operations.
 */
import { useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import type { MobileNet } from '@tensorflow-models/mobilenet';
import type { MLImage } from '../types/ml';
import { ML } from '../constants';

/** Provides a `extractFeatures` function that converts a source into an MLImage with feature vector. */
export function useImageFeatureExtraction(mobilenetModel: MobileNet | null) {
  const thumbnailCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const extractFeatures = useCallback(async (
    source: HTMLVideoElement | HTMLImageElement,
    mirror: boolean
  ): Promise<MLImage | null> => {
    if (!mobilenetModel) return null;

    const sourceWidth = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    const sourceHeight = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
    if (sourceWidth === 0 || sourceHeight === 0) return null;

    const img = tf.browser.fromPixels(source);
    const features = mobilenetModel.infer(img, true) as tf.Tensor;
    const featureArray = Array.from(await features.data()) as number[];

    if (!thumbnailCanvasRef.current) {
      thumbnailCanvasRef.current = document.createElement('canvas');
      thumbnailCanvasRef.current.width = ML.FEATURE_CANVAS_SIZE;
      thumbnailCanvasRef.current.height = ML.FEATURE_CANVAS_SIZE;
    }
    const canvas = thumbnailCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
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

    const newImage: MLImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      dataUrl,
      featureArray,
    };

    img.dispose();
    features.dispose();

    return newImage;
  }, [mobilenetModel]);

  return { extractFeatures };
}
