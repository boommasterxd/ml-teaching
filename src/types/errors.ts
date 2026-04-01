/**
 * errors.ts
 *
 * Defines typed error structures for structured error handling across the application.
 * Exports `ErrorCategory` and `AppError` used throughout the ML pipeline and UI layers.
 */

/**
 * Discriminated union of all error domains in the application.
 *
 * - `model`      — errors during MobileNet or KNN classifier loading
 * - `camera`     — WebRTC stream acquisition or device access failures
 * - `training`   — KNN training failures (e.g. insufficient samples)
 * - `prediction` — inference loop errors during live classification
 * - `validation` — user input or class configuration validation failures
 */
export type ErrorCategory = 'model' | 'camera' | 'training' | 'prediction' | 'validation';

/**
 * Structured error object used throughout the application.
 * Pairs an error domain with a human-readable message for display and logging.
 */
export interface AppError {
  /** The domain in which the error occurred. */
  category: ErrorCategory;
  /** Human-readable description of the error. */
  message: string;
}
