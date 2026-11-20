/**
 * ml.ts
 *
 * Core type definitions for the machine learning pipeline (MobileNet + KNN classifier).
 * Exports the data shapes used across training, prediction, and UI rendering.
 */

/**
 * A single training image with its extracted MobileNet feature vector.
 */
export interface MLImage {
  /** Unique identifier for the image, used as React key and for deletion. */
  id: string;
  /** Base64-encoded data URL of the captured or uploaded image. */
  dataUrl: string;
  /** Flattened MobileNet embedding vector extracted from a 224×224 canvas frame. */
  featureArray: number[];
}

/**
 * A user-defined classification class containing a label, a display color,
 * and all training images collected for that class.
 */
export interface MLClass {
  /** Incremented when clearing images so pending local captures cannot restore them. */
  captureVersion?: number;
  /** Unique identifier for the class. */
  id: string;
  /** Human-readable label shown in the UI and used as the KNN class key. */
  name: string;
  /** All training images collected for this class. */
  images: MLImage[];
  /** Hex color string assigned from the COLORS palette for visual distinction. */
  color: string;
}

/**
 * Result of a single KNN inference pass, containing the winning label
 * and the confidence distribution across all known classes.
 */
export interface Prediction {
  /** The class label with the highest confidence score. */
  label: string;
  /** Map of class label to confidence score in the range [0, 1]. */
  confidences: { [label: string]: number };
}

/**
 * Fixed color palette for assigning distinct colors to user-defined classes.
 * Supports up to six simultaneous classes before cycling would be needed.
 */
export const COLORS = ['#dc2626', '#2563eb', '#047857', '#b45309', '#7c3aed', '#db2777'];
