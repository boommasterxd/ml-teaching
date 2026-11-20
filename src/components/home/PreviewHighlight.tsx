'use client';

import type { ComponentProps } from 'react';
import { useIsPresent } from 'motion/react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { motionTokens, useTempoTransition } from '@animate-ui/react/utils/motion';

export function PreviewHighlight({
  fadeDuration = motionTokens.transition.fade.duration,
  ...props
}: ComponentProps<'g'> & { fadeDuration?: number }) {
  const present = useIsPresent();
  const transition = useTempoTransition({
    ...motionTokens.transition.fade,
    duration: fadeDuration,
  });

  return (
    <Effect asChild fade initial={false} transition={transition}>
      <g {...props} data-preview-active={present || undefined} />
    </Effect>
  );
}
