/**
 * useAppError.ts
 *
 * Hook for structured error management with typed error categories.
 * Replaces the single `useState<string | null>` pattern with categorized
 * `AppError` objects that carry both a category and a human-readable message.
 */
import { useState, useCallback } from 'react';
import type { ErrorCategory, AppError } from '../types/errors';

/**
 * Manages a single active `AppError` with category-aware set and clear
 * operations.
 *
 * @returns An object containing:
 *   - `error` — the current `AppError`, or `null` when no error is active.
 *   - `setError` — sets a new error with the given category and message.
 *   - `clearError` — resets the error state to `null`.
 */
export function useAppError() {
  const [error, setErrorState] = useState<AppError | null>(null);

  /**
   * Sets the active error.
   *
   * @param category - The `ErrorCategory` classifying the error source
   *   (e.g. `'model'`, `'camera'`, `'training'`).
   * @param message - A human-readable description of the error.
   */
  const setError = useCallback((category: ErrorCategory, message: string) => {
    setErrorState({ category, message });
  }, []);

  /** Clears the active error, resetting the state to `null`. */
  const clearError = useCallback(() => setErrorState(null), []);

  return { error, setError, clearError };
}
