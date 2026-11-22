'use client';

import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import { CheckCircle2 } from '@/components/icons/check-circle2';

export function KnnSuccessMedal() {
  const reduce = useShouldReduceMotion();
  return (
    <span className="knn-success-medal" aria-hidden="true">
      <svg viewBox="0 0 64 64" className="absolute inset-0 size-full" fill="none">
        <circle cx="32" cy="32" r="21" fill="var(--success-soft)" stroke="var(--success-border)" />
        <circle cx="32" cy="32" r="17.5" stroke="currentColor" opacity=".48" />
        <path d="M 14 30 A 18 18 0 0 1 30 14" stroke="white" opacity=".7" strokeLinecap="round" />
        <circle
          cx="32"
          cy="32"
          r="14.5"
          stroke="currentColor"
          opacity=".33"
          strokeDasharray="1 3"
        />
        {!reduce && (
          <>
            <Effect
              asChild
              initial={{ scale: 0.76, opacity: 0.65 }}
              animate={{ scale: 1.1, opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            >
              <circle cx="32" cy="32" r="26" stroke="currentColor" />
            </Effect>
            <Effect
              asChild
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.85, 0] }}
              transition={{ duration: 0.6, delay: 0.12 }}
            >
              <path
                d="m50 7 1.2 3.8L55 12l-3.8 1.2L50 17l-1.2-3.8L45 12l3.8-1.2ZM9 40l.8 2.2L12 43l-2.2.8L9 46l-.8-2.2L6 43l2.2-.8Z"
                fill="currentColor"
              />
            </Effect>
          </>
        )}
      </svg>
      <CheckCircle2 animate={!reduce} className="relative size-5" />
    </span>
  );
}
