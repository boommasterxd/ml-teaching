/**
 * useModalState.test.ts
 *
 * Unit tests for the useModalState hook, covering all modal transitions:
 * initial state, opening each modal variant, closing, and overwriting an open modal.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModalState } from '@/hooks/useModalState';
import type { MLImage } from '@/types/ml';

/** Minimal MLImage fixture used across image-preview tests. */
const mockImage: MLImage = {
  id: 'img-1',
  dataUrl: 'data:image/png;base64,abc',
  featureArray: [0.1, 0.2],
};

describe('useModalState', () => {
  it('starts with modal.type === "none"', () => {
    const { result } = renderHook(() => useModalState());
    expect(result.current.modal.type).toBe('none');
  });

  it('opens the image preview modal', () => {
    const { result } = renderHook(() => useModalState());

    act(() => result.current.showImagePreview('class-1', mockImage));

    expect(result.current.modal.type).toBe('imagePreview');
    if (result.current.modal.type === 'imagePreview') {
      expect(result.current.modal.classId).toBe('class-1');
      expect(result.current.modal.image).toEqual(mockImage);
    }
  });

  it('opens the clear-class dialog with the correct classId', () => {
    const { result } = renderHook(() => useModalState());

    act(() => result.current.showClearClass('class-42'));

    expect(result.current.modal.type).toBe('clearClass');
    if (result.current.modal.type === 'clearClass') {
      expect(result.current.modal.classId).toBe('class-42');
    }
  });

  it('opens the remove-class dialog with the correct classId', () => {
    const { result } = renderHook(() => useModalState());

    act(() => result.current.showRemoveClass('class-99'));

    expect(result.current.modal.type).toBe('removeClass');
    if (result.current.modal.type === 'removeClass') {
      expect(result.current.modal.classId).toBe('class-99');
    }
  });

  it('closes any open modal state via closeModal', () => {
    const { result } = renderHook(() => useModalState());

    act(() => result.current.showClearClass('class-1'));
    expect(result.current.modal.type).toBe('clearClass');

    act(() => result.current.closeModal());
    expect(result.current.modal.type).toBe('none');
  });

  it('overwrites an already open modal when a new one is opened', () => {
    const { result } = renderHook(() => useModalState());

    act(() => result.current.showClearClass('class-1'));
    act(() => result.current.showRemoveClass('class-1'));

    expect(result.current.modal.type).toBe('removeClass');
  });
});
