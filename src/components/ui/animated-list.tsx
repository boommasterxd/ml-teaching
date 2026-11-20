'use client';

import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from 'react';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { AutoHeight } from '@animate-ui/react/primitives/effects/auto-height';
import { cn } from '@/lib/utils';
import {
  ReducedMotionConfig,
  spring,
  transition,
  useTempoTransition,
} from '@animate-ui/react/utils/motion';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function AnimatedList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ReducedMotionConfig>
      <AutoHeight
        className="overflow-clip [overflow-clip-margin:4px]"
        style={{ overflow: undefined }}
      >
        <div className={cn('relative flex flex-col gap-6', className)}>
          <AnimatePresence mode="sync" initial={false}>
            {children}
          </AnimatePresence>
        </div>
      </AutoHeight>
    </ReducedMotionConfig>
  );
}

interface AnimatedListItemProps {
  children: ReactNode;
  emptyFocus: RefObject<HTMLElement | null>;
}

/** Sync presence avoids popLayout's injected stylesheet; position reflow follows the inert exit. */
export const AnimatedListItem = forwardRef<HTMLDivElement, AnimatedListItemProps>(
  function AnimatedListItem({ children, emptyFocus }, forwardedRef) {
    const ref = useRef<HTMLDivElement>(null);
    const isPresent = useIsPresent();
    const isClient = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
    const move = useTempoTransition(spring.reflow);
    const fade = useTempoTransition(transition.fade);
    useImperativeHandle(forwardedRef, () => ref.current!, []);

    useLayoutEffect(() => {
      const item = ref.current;
      if (isPresent || !item?.contains(document.activeElement)) return;
      const siblings = [...(item.parentElement?.children ?? [])];
      const index = siblings.indexOf(item);
      const neighbors = [...siblings.slice(index + 1), ...siblings.slice(0, index).reverse()];
      const neighbor = neighbors.find((node) => !node.matches('[inert], [aria-hidden="true"]'));
      const target = neighbor?.querySelector<HTMLElement>(
        'input:not(:disabled), button:not(:disabled), a[href]',
      );
      (target ?? emptyFocus.current)?.focus({ preventScroll: true });
    }, [isPresent, emptyFocus]);

    return (
      <motion.div
        ref={ref}
        data-list-item=""
        inert={!isPresent || undefined}
        aria-hidden={isPresent ? undefined : true}
        layout="position"
        initial={isClient ? { opacity: 0, y: 8 } : false}
        animate={
          isClient ? { opacity: 1, y: 0, transition: { ...move, opacity: fade } } : undefined
        }
        exit={{ opacity: 0, scale: 0.96, transition: fade }}
        transition={move}
      >
        {children}
      </motion.div>
    );
  },
);
