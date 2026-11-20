/**
 * useAppError.test.ts
 *
 * Unit tests for the useAppError hook. Covers initial state, setting errors
 * with category and message, overwriting existing errors, clearing errors,
 * and support for all valid error categories.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppError } from '@/hooks/useAppError';

describe('useAppError', () => {
  it('starts without an error', () => {
    const { result } = renderHook(() => useAppError());
    expect(result.current.error).toBeNull();
  });

  it('sets an error with category and message', () => {
    const { result } = renderHook(() => useAppError());

    act(() => {
      result.current.setError('model', 'Model could not be loaded');
    });

    expect(result.current.error).toEqual({
      category: 'model',
      message: 'Model could not be loaded',
    });
  });

  it('overwrites an existing error', () => {
    const { result } = renderHook(() => useAppError());

    act(() => result.current.setError('camera', 'Camera not available'));
    act(() => result.current.setError('training', 'Training failed'));

    expect(result.current.error).toEqual({
      category: 'training',
      message: 'Training failed',
    });
  });

  it('clears the error with clearError', () => {
    const { result } = renderHook(() => useAppError());

    act(() => result.current.setError('prediction', 'Prediction failed'));
    act(() => result.current.clearError());

    expect(result.current.error).toBeNull();
  });

  it('supports all error categories', () => {
    const { result } = renderHook(() => useAppError());
    const categories = ['model', 'camera', 'training', 'prediction', 'validation'] as const;

    for (const category of categories) {
      act(() => result.current.setError(category, 'Test'));
      expect(result.current.error?.category).toBe(category);
    }
  });
});
