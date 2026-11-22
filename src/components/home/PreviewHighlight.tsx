'use client';

import type { ComponentProps } from 'react';
import { useIsPresent, type Transition } from 'motion/react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { useTempoTransition } from '@animate-ui/react/utils/motion';

export function PreviewHighlight({
  fadeTransition,
  ...props
}: ComponentProps<'g'> & { fadeTransition: Transition }) {
  const present = useIsPresent();
  const transition = useTempoTransition(fadeTransition);

  return (
    <Effect asChild fade initial={false} transition={transition}>
      <g {...props} data-preview-active={present || undefined} />
    </Effect>
  );
}
