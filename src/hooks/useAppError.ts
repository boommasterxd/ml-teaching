/**
 * Hook for structured error management with typed error categories.
 * Replaces the single `useState<string | null>` pattern with categorized errors.
 */
import { useState, useCallback } from 'react';
import type { ErrorCategory, AppError } from '../types/errors';

/** Provides typed error state with category-aware set/clear operations. */
export function useAppError() {
  const [error, setErrorState] = useState<AppError | null>(null);

  const setError = useCallback((category: ErrorCategory, message: string) => {
    setErrorState({ category, message });
  }, []);

  const clearError = useCallback(() => setErrorState(null), []);

  return { error, setError, clearError };
}
