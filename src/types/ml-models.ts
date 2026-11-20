/**
 * ml-models.ts
 *
 * Minimal interfaces for the ML model dependencies used throughout the
 * application. Hooks depend on these interfaces instead of the concrete
 * TensorFlow.js types, which keeps them testable without requiring the
 * real TF.js runtime.
 */
import type * as tf from '@tensorflow/tfjs-core';

/**
 * Loaded MobileNet embedding model.
 */
export interface FeatureExtractor {
  /** Returns the embedding tensor for the given input. */
  infer(input: tf.Tensor): tf.Tensor;
  /** Releases downloaded weights when leaving the training page. */
  dispose(): void;
}

/**
 * Result shape returned by a classifier's `predictClass` method.
 */
interface ClassificationResult {
  /** The class label with the highest confidence score. */
  label: string;
  /** Map of class label to confidence score in the range [0, 1]. */
  confidences: Record<string, number>;
}

/**
 * Minimal interface for a KNN-style classifier.
 * Covers only the methods actually called by the application.
 */
export interface Classifier {
  /** Adds a training example for the given label. */
  addExample(example: tf.Tensor, label: string): void;
  /** Takes ownership of the normalized per-class matrices of a new classifier. */
  setClassifierDataset(dataset: Record<string, tf.Tensor2D>): void;
  /** Returns the predicted class label and confidence scores. */
  predictClass(input: tf.Tensor): Promise<ClassificationResult>;
  /** Returns the number of distinct classes currently stored. */
  getNumClasses(): number;
  /** Releases all internal tensors and frees memory. */
  dispose(): void;
}
