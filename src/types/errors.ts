/**
 * Typed error categories for structured error handling across the application.
 */

export type ErrorCategory = 'model' | 'camera' | 'training' | 'prediction' | 'validation';

export interface AppError {
  category: ErrorCategory;
  message: string;
}
