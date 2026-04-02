import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModalState } from '../hooks/useModalState';
import type { MLImage } from '../types/ml';

const mockImage: MLImage = {
  id: 'img-1',
  dataUrl: 'data:image/png;base64,abc',
  featureArray: [0.1, 0.2],
};

describe('useModalState', () => {
  it('startet mit modal.type === "none"', () => {
    const { result } = renderHook(() => useModalState());
    expect(result.current.modal.type).toBe('none');
  });

  it('öffnet die Bildvorschau', () => {
    const { result } = renderHook(() => useModalState());

    act(() => result.current.showImagePreview('class-1', mockImage));

    expect(result.current.modal.type).toBe('imagePreview');
    if (result.current.modal.type === 'imagePreview') {
      expect(result.current.modal.classId).toBe('class-1');
      expect(result.current.modal.image).toEqual(mockImage);
    }
  });

  it('öffnet den ClearAll-Dialog', () => {
    const { result } = renderHook(() => useModalState());

    act(() => result.current.showClearConfirm());

    expect(result.current.modal.type).toBe('clearConfirm');
  });

  it('öffnet den ClearClass-Dialog mit der richtigen classId', () => {
    const { result } = renderHook(() => useModalState());

    act(() => result.current.showClearClass('class-42'));

    expect(result.current.modal.type).toBe('clearClass');
    if (result.current.modal.type === 'clearClass') {
      expect(result.current.modal.classId).toBe('class-42');
    }
  });

  it('öffnet den RemoveClass-Dialog mit der richtigen classId', () => {
    const { result } = renderHook(() => useModalState());

    act(() => result.current.showRemoveClass('class-99'));

    expect(result.current.modal.type).toBe('removeClass');
    if (result.current.modal.type === 'removeClass') {
      expect(result.current.modal.classId).toBe('class-99');
    }
  });

  it('schließt jeden Modal-Zustand mit closeModal', () => {
    const { result } = renderHook(() => useModalState());

    act(() => result.current.showClearConfirm());
    expect(result.current.modal.type).toBe('clearConfirm');

    act(() => result.current.closeModal());
    expect(result.current.modal.type).toBe('none');
  });

  it('überschreibt einen offenen Modal wenn ein neuer geöffnet wird', () => {
    const { result } = renderHook(() => useModalState());

    act(() => result.current.showClearConfirm());
    act(() => result.current.showRemoveClass('class-1'));

    expect(result.current.modal.type).toBe('removeClass');
  });
});
