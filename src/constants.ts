/**
 * constants.ts
 *
 * Central registry of all magic numbers and configuration values used across
 * the application. Grouped by domain to avoid scattering literals throughout
 * the codebase.
 */

/**
 * Machine-learning configuration for MobileNet feature extraction and KNN
 * training. These values are tuned for the TensorFlow.js browser runtime.
 */
export const ML = {
  /** Maximum number of distinct classes a user can create. */
  MAX_CLASSES: 15,
  /** Minimum number of distinct classes required before training is allowed. */
  MIN_CLASSES: 2,
  /** Minimum number of training images required per class. */
  MIN_IMAGES_PER_CLASS: 10,
  /** Maximum number of training images allowed per class to prevent unbounded RAM growth. */
  MAX_IMAGES_PER_CLASS: 200,
  /**
   * Edge length (in pixels) of the square canvas used to extract MobileNet
   * feature vectors. MobileNet expects exactly 224×224 input.
   */
  FEATURE_CANVAS_SIZE: 224,
  /** MobileNet major version passed to the TensorFlow.js model loader. */
  MOBILENET_VERSION: 2 as const,
  /**
   * MobileNet width multiplier (alpha). 1.0 uses the full-size network for
   * maximum accuracy; lower values trade accuracy for speed.
   */
  MOBILENET_ALPHA: 1.0,
  /**
   * JPEG quality factor (0–1) used when encoding captured frames as
   * data-URL thumbnails for display in the UI.
   */
  THUMBNAIL_QUALITY: 0.9,
  /** Maximum number of characters allowed in a user-defined class name. */
  MAX_CLASS_NAME_LENGTH: 50,
  /**
   * Delay in milliseconds yielded to the browser before starting the synchronous
   * KNN training loop. Allows React to render the isTraining spinner first.
   */
  TRAINING_UI_YIELD_MS: 100,
  /**
   * Number of KNN addExample calls between async yield points during training.
   * Keeps the main thread responsive by returning control to the browser every N iterations.
   */
  TRAINING_BATCH_SIZE: 8,
} as const;

/**
 * Camera capture and stream configuration for the WebRTC pipeline.
 */
export const CAMERA = {
  /** Interval in milliseconds between consecutive frame captures during recording. */
  CAPTURE_INTERVAL_MS: 100,
  /** Preferred camera stream width in pixels (may be lower on constrained devices). */
  IDEAL_WIDTH: 640,
  /** Preferred camera stream height in pixels (may be lower on constrained devices). */
  IDEAL_HEIGHT: 480,
} as const;

/**
 * Timing values for UI animations (Framer Motion step transitions).
 */
export const ANIMATION = {
  /** Duration in milliseconds for each animated step transition. */
  STEP_DURATION_MS: 400,
} as const;

/**
 * Retry strategy for loading the MobileNet and KNN-Classifier models.
 * Uses exponential back-off: delay doubles with each failed attempt.
 */
export const MODEL_LOAD_RETRY = {
  /** Total number of load attempts before the operation is considered failed. */
  MAX_ATTEMPTS: 3,
  /** Initial back-off delay in milliseconds before the first retry. */
  BASE_DELAY_MS: 1000,
  /** Timeout in milliseconds for a single model load attempt before triggering a retry. */
  LOAD_TIMEOUT_MS: 30_000,
} as const;

/**
 * Timing for the live prediction loop that runs during classification.
 */
export const PREDICTION = {
  /** Target interval in milliseconds between inference calls (≈ 15 FPS). */
  INTERVAL_MS: 1000 / 15,
  /**
   * Maximum number of consecutive inference errors before the prediction loop
   * stops automatically and surfaces an error to the user.
   */
  MAX_CONSECUTIVE_ERRORS: 10,
} as const;

/**
 * Layout and styling constants for the neural network visualization on the
 * landing page. Centralises all magic numbers used in NeuralNetViz.tsx and
 * useNeuralNetAnimation.ts so visual parameters are easy to adjust.
 */
export const NEURAL_NET_VIZ = {
  /** Height in pixels of the SVG canvas that holds the node circles. */
  CANVAS_HEIGHT: 320,
  /** Diameter in pixels of each node circle. */
  NODE_HEIGHT: 24,
  /** Vertical gap in pixels between consecutive nodes in the same layer. */
  NODE_GAP: 16,
  /** Left offset in percent for the first layer column. */
  LAYER_OFFSET_PERCENT: 5,
  /** Width in percent of each layer column (also the step between columns). */
  LAYER_WIDTH_PERCENT: 20,
  /** Horizontal center positions of the four network layers as CSS percent strings. */
  LAYER_X_POSITIONS: ['15%', '35%', '55%', '75%'] as const,
  /** Stroke colours for SVG connection lines and active node glow. */
  COLORS: {
    DOG: '#ef4444',
    CAT: '#3b82f6',
    INACTIVE: '#a1a1aa',
  },
  /** Opacity values for active vs. inactive SVG connection lines. */
  OPACITY: {
    ACTIVE: 0.6,
    INACTIVE: 0.35,
  },
  /** Human-readable demo result labels shown after the animation completes. */
  DEMO_RESULTS: {
    DOG: 'Hund erkannt (98%)',
    CAT: 'Katze erkannt (95%)',
  },
} as const;
