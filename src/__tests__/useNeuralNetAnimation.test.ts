/**
 * useNeuralNetAnimation.test.ts
 *
 * Unit tests for the useNeuralNetAnimation hook. Covers initial state,
 * the 7-step animation sequence driven by fake timers, signal/result
 * assignment for both animation types, guard against concurrent animations,
 * and timeout cleanup on unmount.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNeuralNetAnimation } from '../hooks/useNeuralNetAnimation';
import { ANIMATION, NEURAL_NET_VIZ } from '../constants';

const STEP = ANIMATION.STEP_DURATION_MS;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useNeuralNetAnimation', () => {
  describe('Initialer Zustand', () => {
    it('activeSignal startet als null', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());
      expect(result.current.activeSignal).toBeNull();
    });

    it('animStep startet als -1', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());
      expect(result.current.animStep).toBe(-1);
    });

    it('animating startet als false', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());
      expect(result.current.animating).toBe(false);
    });

    it('result startet als null', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());
      expect(result.current.result).toBeNull();
    });
  });

  describe('triggerAnimation dog', () => {
    it('setzt animating und activeSignal sofort beim Start', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());

      act(() => { result.current.triggerAnimation('dog'); });

      expect(result.current.animating).toBe(true);
      expect(result.current.activeSignal).toBe('dog');
      expect(result.current.animStep).toBe(0);
    });

    it('durchläuft alle 7 Schritte', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());

      act(() => { result.current.triggerAnimation('dog'); });

      for (let step = 1; step <= 7; step++) {
        act(() => { vi.advanceTimersByTime(STEP); });
        if (step < 7) {
          expect(result.current.animStep).toBe(step);
        }
      }

      expect(result.current.animStep).toBe(7);
    });

    it('setzt das richtige Ergebnis nach Abschluss', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());

      act(() => { result.current.triggerAnimation('dog'); });
      act(() => { vi.advanceTimersByTime(STEP * 7); });

      expect(result.current.result).toBe(NEURAL_NET_VIZ.DEMO_RESULTS.DOG);
    });

    it('setzt animating auf false nach Abschluss', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());

      act(() => { result.current.triggerAnimation('dog'); });
      act(() => { vi.advanceTimersByTime(STEP * 7); });

      expect(result.current.animating).toBe(false);
    });
  });

  describe('triggerAnimation cat', () => {
    it('setzt das richtige Ergebnis für cat', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());

      act(() => { result.current.triggerAnimation('cat'); });
      act(() => { vi.advanceTimersByTime(STEP * 7); });

      expect(result.current.result).toBe(NEURAL_NET_VIZ.DEMO_RESULTS.CAT);
      expect(result.current.activeSignal).toBe('cat');
    });
  });

  describe('Blockierung bei laufender Animation', () => {
    it('ignoriert triggerAnimation wenn Animation läuft', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());

      act(() => { result.current.triggerAnimation('dog'); });
      act(() => { vi.advanceTimersByTime(STEP * 3); });

      act(() => { result.current.triggerAnimation('cat'); });

      expect(result.current.activeSignal).toBe('dog');
    });
  });

  describe('Cleanup bei Unmount', () => {
    it('cancelt ausstehende Timeouts beim Unmount', () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
      const { result, unmount } = renderHook(() => useNeuralNetAnimation());

      act(() => { result.current.triggerAnimation('dog'); });
      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});
