'use client';

import { useEffect, useState, ViewTransition, type ComponentProps, type Key } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { EntryViewportReadyContext, InitialEntryContext } from '@/components/ui/entry-policy';
import { useMotionPreference } from '@/components/ui/use-motion-preference';
import { subscribeToHistoryTransitions } from '@/lib/history-transition';
import { VIEW_TRANSITION_RESET } from '@/lib/view-transition-styles';

type PageTransitionEffect = 'flow' | 'fade';
type PageTransitionProps = ComponentProps<'div'> & {
  effect?: PageTransitionEffect;
  pageKey?: Key;
};

const routeClasses = {
  flow: { default: 'none', 'nav-forward': 'page-flow', 'nav-back': 'page-flow' },
  fade: { default: 'none', 'nav-forward': 'page-fade', 'nav-back': 'page-fade' },
};

export function PageTransition({
  effect = 'flow',
  pageKey,
  className,
  children,
  ...props
}: PageTransitionProps) {
  const pathname = usePathname();
  const page = pageKey ?? pathname;
  const { reduce } = useMotionPreference();
  const canAnimateArrival = !reduce && pathname !== null;
  const [arrival, setArrival] = useState({ page, initial: true, ready: true, alternate: false });
  const capture = arrival.alternate ? 'page-b' : 'page-a';
  // Separate snapshots keep each page's own scroll position and dimensions.
  if (arrival.page !== page)
    setArrival({ page, initial: false, ready: false, alternate: !arrival.alternate });
  useEffect(() => {
    if (reduce || !window.navigation) return;
    const content = document.querySelector<HTMLElement>('[data-route-capture]');
    if (content) return subscribeToHistoryTransitions(window.navigation, content);
  }, [reduce]);
  useEffect(() => {
    if (arrival.ready) return;
    let current = true;
    const frame = requestAnimationFrame(() => {
      const transition = document.activeViewTransition;
      const done = transition ? transition.finished : Promise.resolve();
      void done
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === 'AbortError')) throw error;
        })
        .finally(() => {
          if (current)
            setArrival((value) => (value.page === page ? { ...value, ready: true } : value));
        });
    });
    return () => {
      current = false;
      cancelAnimationFrame(frame);
    };
  }, [page, arrival.ready]);
  return (
    <ViewTransition
      name={capture}
      default="none"
      update={!arrival.ready && canAnimateArrival ? routeClasses[effect] : 'none'}
    >
      <div
        data-slot="page-transition"
        data-route-capture={capture}
        data-route-path={pathname}
        className={cn('page-transition', className)}
        {...props}
      >
        <style href="motion-view-transition-reset" precedence="default">
          {VIEW_TRANSITION_RESET}
        </style>
        <InitialEntryContext value={arrival.initial}>
          <EntryViewportReadyContext value={arrival.ready}>{children}</EntryViewportReadyContext>
        </InitialEntryContext>
      </div>
    </ViewTransition>
  );
}
