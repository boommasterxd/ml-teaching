/**
 * Type definitions for the machine learning pipeline (MobileNet + KNN classifier).
 */

/** A single training image with its extracted feature vector. */
export interface MLImage {
  id: string;
  dataUrl: string;
  featureArray: number[];
}

/** A user-defined classification class containing collected training images. */
export interface MLClass {
  id: string;
  name: string;
  images: MLImage[];
  color: string;
}

/** Result of a KNN prediction with per-class confidence scores. */
export interface Prediction {
  label: string;
  confidences: { [label: string]: number };
}

/** Palette used to visually distinguish classes in the UI. */
export const COLORS = ['#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777'];
