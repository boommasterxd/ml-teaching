'use client';

import { useId, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { usePageVisible } from '@animate-ui/react/utils/use-page-visible';
import {
  motionTokens,
  useShouldReduceMotion,
  useTempoTransition,
} from '@animate-ui/react/utils/motion';
import { useHomePlayback } from './HomePlaybackProvider';

const wavePaths = Array.from({ length: 12 }, (_, i) => {
  const spread = i - 5.5;
  return [
    `M2 ${66 + spread * 5.5}`,
    `C50 ${66 + spread * 5.5} 63 ${65 - spread * 8} 105 ${51 - spread * 5}`,
    `S150 ${46 + spread * 9} 190 ${53 + spread * 6}`,
    `S243 ${5 - spread * 1.4} 266 ${25 - spread * 1.9}`,
    `S307 ${98 + spread * 2} 336 ${77 + spread * 2}`,
    `S374 ${50 - spread} 418 ${51 + spread * 0.38}`,
  ].join(' ');
}).join(' ');

export default function PurposeWaveform() {
  const id = useId();
  const root = useRef<SVGSVGElement>(null);
  const inView = useInView(root, { amount: 0.3 });
  const pageVisible = usePageVisible();
  const { paused } = useHomePlayback();
  const reduce = useShouldReduceMotion();
  const [phase, setPhase] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const timing = useTempoTransition({ duration: 1.3, ease: motionTokens.ease.draw });
  const visible = inView && pageVisible;
  const staticOnly = paused || reduce;
  if (phase === 'waiting' && visible) setPhase(staticOnly ? 'finished' : 'playing');
  if (phase === 'playing' && (!visible || staticOnly)) setPhase('finished');

  return (
    <svg
      ref={root}
      viewBox="0 0 420 110"
      className="home-purpose-waveform"
      aria-hidden="true"
      fill="none"
      stroke={`url(#${id}-light)`}
    >
      <defs>
        <linearGradient id={`${id}-light`} x1="0%" x2="100%">
          <stop stopColor="var(--primary)" />
          <stop offset="54%" stopColor="var(--foreground)" />
          <stop offset="100%" stopColor="var(--primary)" />
        </linearGradient>
        <path id={id} d={wavePaths} />
      </defs>
      <use href={`#${id}`} opacity={phase === 'finished' || staticOnly ? 1 : 0.46} />
      {phase === 'playing' && (
        <Effect
          asChild
          initial={{ clipPath: 'inset(0% 100% 0% 0%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          transition={timing}
          onAnimationComplete={() => setPhase('finished')}
        >
          <g>
            <use href={`#${id}`} />
          </g>
        </Effect>
      )}
    </svg>
  );
}
