/**
 * useNeuralNetAnimation.ts
 *
 * Manages the multi-step forward-propagation animation for the neural network
 * visualization on the landing page. Orchestrates 7 sequential animation steps
 * via staggered timeouts, driven by `ANIMATION.STEP_DURATION_MS`.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { ANIMATION } from '../constants';

/**
 * Manages animation state and timeout orchestration for the neural network
 * visualization. Exposes the current animation step, active signal type,
 * animation status, prediction result label, and a trigger function.
 *
 * @returns An object with the following fields:
 *   - `activeSignal` — the signal type currently being animated (`'dog'`, `'cat'`, or `null`).
 *   - `animStep` — the current animation step index (`-1` = idle, `0`–`7` = active steps).
 *   - `animating` — whether an animation is currently in progress.
 *   - `result` — the human-readable prediction label shown after the final step, or `null`.
 *   - `triggerAnimation` — starts a new animation sequence for the given signal type.
 */
export function useNeuralNetAnimation() {
  const [activeSignal, setActiveSignal] = useState<'dog' | 'cat' | null>(null);
  const [animStep, setAnimStep] = useState(-1);
  const [animating, setAnimating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Tracks all pending timeout IDs so they can be cancelled on re-trigger or unmount.
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clears all pending timeouts when the component unmounts to prevent state updates on
  // an unmounted component.
  useEffect(() => {
    return () => { timeoutIdsRef.current.forEach(clearTimeout); };
  }, []);

  /**
   * Starts the forward-propagation animation sequence for the given signal type.
   * No-ops if an animation is already running. Cancels any orphaned timeouts from a
   * previous run before scheduling the new sequence.
   *
   * Steps 0–6 advance `animStep` at each `ANIMATION.STEP_DURATION_MS` interval.
   * Step 7 sets the final `result` label and marks the animation as complete.
   *
   * @param type - The signal type to animate: `'dog'` or `'cat'`.
   */
  const triggerAnimation = useCallback((type: 'dog' | 'cat') => {
    if (animating) return;
    timeoutIdsRef.current.forEach(clearTimeout);
    setAnimating(true);
    setActiveSignal(type);
    setResult(null);
    setAnimStep(0);

    const d = ANIMATION.STEP_DURATION_MS;

    timeoutIdsRef.current = [
      setTimeout(() => setAnimStep(1), d * 1),
      setTimeout(() => setAnimStep(2), d * 2),
      setTimeout(() => setAnimStep(3), d * 3),
      setTimeout(() => setAnimStep(4), d * 4),
      setTimeout(() => setAnimStep(5), d * 5),
      setTimeout(() => setAnimStep(6), d * 6),
      setTimeout(() => {
        setAnimStep(7);
        setResult(type === 'dog' ? 'Hund erkannt (98%)' : 'Katze erkannt (95%)');
        setAnimating(false);
        timeoutIdsRef.current = [];
      }, d * 7),
    ];
  }, [animating]);

  return { activeSignal, animStep, animating, result, triggerAnimation };
}
