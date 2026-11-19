'use client';

import type { ComponentProps, ReactElement } from 'react';
import { useRender } from '@base-ui/react/use-render';
import { MotionConfig } from 'motion/react';
import { ReducedMotionContext, type ReducedMotion } from '@animate-ui/react/utils/motion';

/** Restore the inherited preference below Effect's stable, non-remounting motion boundary. */
export function EntryTarget({
  asChild,
  preference,
  children,
  ...props
}: ComponentProps<'div'> & {
  asChild: boolean;
  preference: ReducedMotion;
  children: ReactElement;
}) {
  const target = useRender({
    render: asChild ? children : undefined,
    props: asChild ? props : { ...props, children },
  });
  return (
    <ReducedMotionContext value={preference}>
      <MotionConfig reducedMotion={preference}>{target}</MotionConfig>
    </ReducedMotionContext>
  );
}
