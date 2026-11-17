'use client';

import type { ComponentProps } from 'react';
import { Slot } from 'radix-ui';
import { MotionConfig } from 'motion/react';
import { ReducedMotionContext, type ReducedMotion } from '@animate-ui/react/utils/motion';

/** Restore the inherited preference below Effect's stable, non-remounting motion boundary. */
export function EntryTarget({
  asChild,
  preference,
  ...props
}: ComponentProps<'div'> & { asChild: boolean; preference: ReducedMotion }) {
  const Target = asChild ? Slot.Root : 'div';
  return (
    <ReducedMotionContext value={preference}>
      <MotionConfig reducedMotion={preference}>
        <Target {...props} />
      </MotionConfig>
    </ReducedMotionContext>
  );
}
