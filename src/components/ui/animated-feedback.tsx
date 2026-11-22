'use client';

import type { ReactNode } from 'react';
import { useIsPresent } from 'motion/react';
import { AutoHeight } from '@animate-ui/react/primitives/effects/auto-height';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { cn } from '@/lib/utils';

export function AnimatedFeedback({
  children,
  contentKey,
  contentClassName,
}: {
  children: ReactNode;
  contentKey?: string;
  contentClassName?: string;
}) {
  const present = useIsPresent();
  return (
    <AutoHeight
      data-slot="animated-feedback"
      initial={{ height: 0 }}
      exit={{ height: 0 }}
      aria-hidden={present ? undefined : true}
      inert={!present || undefined}
    >
      <Effect
        key={contentKey}
        fade
        slide={{ direction: 'up', offset: 8 }}
        className={cn('pt-6', contentClassName)}
      >
        {children}
      </Effect>
    </AutoHeight>
  );
}
