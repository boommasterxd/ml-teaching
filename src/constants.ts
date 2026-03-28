/**
 * Shared constants used across the application.
 * Centralizes magic numbers to improve maintainability.
 */

export const ML = {
  MIN_CLASSES: 2,
  MIN_IMAGES_PER_CLASS: 10,
  FEATURE_CANVAS_SIZE: 224,
  MOBILENET_VERSION: 2 as const,
  MOBILENET_ALPHA: 1.0,
  THUMBNAIL_QUALITY: 0.9,
} as const;

export const CAMERA = {
  CAPTURE_INTERVAL_MS: 100,
  IDEAL_WIDTH: 640,
  IDEAL_HEIGHT: 480,
} as const;

export const ANIMATION = {
  STEP_DURATION_MS: 400,
} as const;

export const MODEL_LOAD_RETRY = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY_MS: 1000,
} as const;

export const PREDICTION = {
  INTERVAL_MS: 1000 / 15,
} as const;
