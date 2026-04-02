import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppError } from '../hooks/useAppError';

describe('useAppError', () => {
  it('startet ohne Fehler', () => {
    const { result } = renderHook(() => useAppError());
    expect(result.current.error).toBeNull();
  });

  it('setzt einen Fehler mit Kategorie und Nachricht', () => {
    const { result } = renderHook(() => useAppError());

    act(() => {
      result.current.setError('model', 'Modell konnte nicht geladen werden');
    });

    expect(result.current.error).toEqual({
      category: 'model',
      message: 'Modell konnte nicht geladen werden',
    });
  });

  it('überschreibt einen bestehenden Fehler', () => {
    const { result } = renderHook(() => useAppError());

    act(() => result.current.setError('camera', 'Kamera nicht verfügbar'));
    act(() => result.current.setError('training', 'Training fehlgeschlagen'));

    expect(result.current.error).toEqual({
      category: 'training',
      message: 'Training fehlgeschlagen',
    });
  });

  it('löscht den Fehler mit clearError', () => {
    const { result } = renderHook(() => useAppError());

    act(() => result.current.setError('prediction', 'Vorhersage fehlgeschlagen'));
    act(() => result.current.clearError());

    expect(result.current.error).toBeNull();
  });

  it('unterstützt alle Fehlerkategorien', () => {
    const { result } = renderHook(() => useAppError());
    const categories = ['model', 'camera', 'training', 'prediction', 'validation'] as const;

    for (const category of categories) {
      act(() => result.current.setError(category, 'Test'));
      expect(result.current.error?.category).toBe(category);
    }
  });
});
