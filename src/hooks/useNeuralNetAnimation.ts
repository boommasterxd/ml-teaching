/**
 * Hook that manages the multi-step forward-propagation animation
 * for the neural network visualization.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { ANIMATION } from '../constants';

/** Encapsulates animation state and timeout orchestration for the neural network viz. */
export function useNeuralNetAnimation() {
  const [activeSignal, setActiveSignal] = useState<'dog' | 'cat' | null>(null);
  const [animStep, setAnimStep] = useState(-1);
  const [animating, setAnimating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => { timeoutIdsRef.current.forEach(clearTimeout); };
  }, []);

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
