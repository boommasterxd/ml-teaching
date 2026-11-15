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
import { useNeuralNetAnimation } from '@/hooks/useNeuralNetAnimation';
import { ANIMATION, NEURAL_NET_VIZ } from '@/constants';

/** Shorthand for the configured step duration to keep timer advances readable. */
const STEP = ANIMATION.STEP_DURATION_MS;

// Replace real timers with fake ones before each test so setTimeout calls
// can be advanced manually without waiting for real time.
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useNeuralNetAnimation', () => {
  describe('initial state', () => {
    it('activeSignal starts as null', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());
      expect(result.current.activeSignal).toBeNull();
    });

    it('animStep starts as -1', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());
      expect(result.current.animStep).toBe(-1);
    });

    it('animating starts as false', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());
      expect(result.current.animating).toBe(false);
    });

    it('result starts as null', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());
      expect(result.current.result).toBeNull();
    });
  });

  describe('triggerAnimation dog', () => {
    it('sets animating and activeSignal immediately on start', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());

      act(() => {
        result.current.triggerAnimation('dog');
      });

      expect(result.current.animating).toBe(true);
      expect(result.current.activeSignal).toBe('dog');
      expect(result.current.animStep).toBe(0);
    });

    it('advances through all 7 steps', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());

      act(() => {
        result.current.triggerAnimation('dog');
      });

      // Each timer tick advances one step; after step 7 the animation finishes.
      for (let step = 1; step <= 7; step++) {
        act(() => {
          vi.advanceTimersByTime(STEP);
        });
        if (step < 7) {
          expect(result.current.animStep).toBe(step);
        }
      }

      expect(result.current.animStep).toBe(7);
    });

    it('sets the correct result after completion', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());

      act(() => {
        result.current.triggerAnimation('dog');
      });
      act(() => {
        vi.advanceTimersByTime(STEP * 7);
      });

      expect(result.current.result).toBe(NEURAL_NET_VIZ.DEMO_RESULTS.DOG);
    });

    it('sets animating to false after completion', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());

      act(() => {
        result.current.triggerAnimation('dog');
      });
      act(() => {
        vi.advanceTimersByTime(STEP * 7);
      });

      expect(result.current.animating).toBe(false);
    });
  });

  describe('triggerAnimation cat', () => {
    it('sets the correct result for cat', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());

      act(() => {
        result.current.triggerAnimation('cat');
      });
      act(() => {
        vi.advanceTimersByTime(STEP * 7);
      });

      expect(result.current.result).toBe(NEURAL_NET_VIZ.DEMO_RESULTS.CAT);
      expect(result.current.activeSignal).toBe('cat');
    });
  });

  describe('guard against concurrent animations', () => {
    it('ignores triggerAnimation calls while an animation is running', () => {
      const { result } = renderHook(() => useNeuralNetAnimation());

      act(() => {
        result.current.triggerAnimation('dog');
      });
      // Advance partway through the sequence so the animation is still active.
      act(() => {
        vi.advanceTimersByTime(STEP * 3);
      });

      // Attempting to start a second animation should be ignored.
      act(() => {
        result.current.triggerAnimation('cat');
      });

      expect(result.current.activeSignal).toBe('dog');
    });
  });

  describe('cleanup on unmount', () => {
    it('cancels pending timeouts on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
      const { result, unmount } = renderHook(() => useNeuralNetAnimation());

      act(() => {
        result.current.triggerAnimation('dog');
      });
      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});
