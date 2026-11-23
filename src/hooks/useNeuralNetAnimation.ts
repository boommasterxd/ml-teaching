/**
 * useNeuralNetAnimation.ts
 *
 * Advances the educational feature-extraction and neighbor-vote stages.
 * Timers select algorithmic stages; Animate UI owns all visual interpolation.
 */
import { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { ANIMATION, NETWORK_STAGES } from '../constants';
import { NETWORK_RESULTS } from '../lib/network-demo';

/**
 * Manages animation state and timeout orchestration for the neural network
 * visualization. Exposes the current animation step, active signal type,
 * animation status, prediction result label, and a trigger function.
 *
 * @returns An object with the following fields:
 *   - `activeSignal` — the signal type currently being animated (`'dog'`, `'cat'`, or `null`).
 *   - `animStep` — the current stage (`-1` = idle, `0`–`9` = active/completed stages).
 *   - `animating` — whether an animation is currently in progress.
 *   - `result` — the human-readable prediction label shown after the final step, or `null`.
 *   - `sequence` — identifies each selected example so its decorative signal can restart.
 *   - `triggerAnimation` — starts a new animation sequence for the given signal type.
 */
export function useNeuralNetAnimation(visible = true) {
  const [activeSignal, setActiveSignal] = useState<'dog' | 'cat' | null>(null);
  const [animStep, setAnimStep] = useState(-1);
  const [animating, setAnimating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [sequence, setSequence] = useState(0);

  const currentStep = useRef(0);
  useLayoutEffect(() => {
    if (!visible || !animating || !activeSignal) return;
    const signal = activeSignal;
    let timer = setTimeout(advance, ANIMATION.STEP_DURATION_MS);
    function advance() {
      const step = ++currentStep.current;
      setAnimStep(step);
      if (step === NETWORK_STAGES.COMPLETE) {
        setResult(NETWORK_RESULTS[signal]);
        setAnimating(false);
      } else {
        timer = setTimeout(advance, ANIMATION.STEP_DURATION_MS);
      }
    }
    return () => clearTimeout(timer);
  }, [activeSignal, animating, visible]);

  /**
   * Starts the forward-propagation animation sequence for the given signal type.
   * No-ops if an animation is already running. The sequence advances only while visible.
   *
   * Each stage advances at `ANIMATION.STEP_DURATION_MS` intervals.
   * Completion announces the neighbor vote and releases the input controls.
   *
   * @param type - The signal type to animate: `'dog'` or `'cat'`.
   */
  const triggerAnimation = useCallback(
    (type: 'dog' | 'cat') => {
      if (animating) return;
      currentStep.current = 0;
      setAnimating(true);
      setActiveSignal(type);
      setResult(null);
      setSequence((current) => current + 1);
      setAnimStep(0);
    },
    [animating],
  );

  return { activeSignal, animStep, animating, result, sequence, triggerAnimation };
}
