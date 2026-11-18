'use client';

import { spring, useShouldReduceMotion, useTempoTransition } from '@animate-ui/react/utils/motion';
import { AnimateView } from 'motion/react-animate-view';

/** Hand the selected background across native route snapshots while labels stay in their rows. */
export default function LegalSelection() {
  const reduce = useShouldReduceMotion();
  const slide = useTempoTransition(spring.selection);
  const selection = <span aria-hidden="true" className="legal-selection" />;
  if (reduce) return selection;
  return (
    <AnimateView name="legal-selection" transition={slide}>
      {selection}
    </AnimateView>
  );
}
