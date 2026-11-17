'use client';

import { useEffect, useState, type ComponentProps, type Key } from 'react';
import { usePathname } from 'next/navigation';
import type { TargetAndTransition } from 'motion/react';
import { AnimateView } from 'motion/react-animate-view';
import { blur, ease, useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import { cn } from '@/lib/utils';
import { EntryViewportReadyContext, InitialEntryContext } from '@/components/ui/entry-policy';

// Exact trusted bytes emitted by Motion's AnimateView reset hook, also hashed during SSG.
export const VIEW_TRANSITION_RESET = `
    ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) {
        animation-timing-function: linear !important;
    }
    `;

type PageTransitionEffect = 'flow' | 'fade';
type PageTransitionProps = ComponentProps<'div'> & {
  effect?: PageTransitionEffect;
  pageKey?: Key;
};

/** Adapted official Animate UI PageTransition; see the CSP integration in the design guide. */
const EFFECTS = {
  fade: () => ({
    enter: {
      opacity: [0, 1],
      filter: [blur.panel, 'blur(0px)'],
      transition: { duration: 0.3, ease: ease.out },
    },
    exit: {
      opacity: [1, 0],
      filter: ['blur(0px)', blur.panel],
      transition: { duration: 0.15, ease: ease.leave },
    },
  }),
  flow: (back: boolean) => {
    const from = back ? -30 : 30;
    return {
      enter: {
        opacity: [0, 1],
        transform: [`translateX(${from}%)`, 'none'],
        filter: ['blur(12px)', 'blur(0px)'],
        transition: { duration: 0.35, ease: ease.out },
      },
      exit: {
        opacity: [1, 0],
        transform: ['none', `translateX(${-from}%)`],
        filter: ['blur(0px)', 'blur(12px)'],
        transition: { duration: 0.25, ease: ease.leave },
      },
    };
  },
} satisfies Record<
  PageTransitionEffect,
  (back: boolean) => { enter: TargetAndTransition; exit: TargetAndTransition }
>;

let marks = 0;

function markRoot() {
  const root = document.documentElement;
  const mark = ++marks;
  root.setAttribute('data-page-transition', '');
  const transition = (document as Document & { activeViewTransition?: ViewTransition | null })
    .activeViewTransition;
  const done = transition
    ? transition.finished
    : new Promise((resolve) => requestAnimationFrame(resolve)).then(() =>
        Promise.all(
          root
            .getAnimations({ subtree: true })
            .filter((animation) =>
              (animation.effect as KeyframeEffect | null)?.pseudoElement?.startsWith(
                '::view-transition',
              ),
            )
            .map((animation) => animation.finished),
        ),
      );
  // Superseded native snapshots reject their finished promise; cleanup still belongs to this mark.
  void done
    .catch(() => {})
    .finally(() => {
      if (mark === marks) root.removeAttribute('data-page-transition');
    });
}

export function PageTransition({
  effect = 'flow',
  pageKey,
  className,
  children,
  ...props
}: PageTransitionProps) {
  const pathname = usePathname();
  const [arrival, setArrival] = useState({ path: pathname, initial: true, ready: true });
  if (arrival.path !== pathname) setArrival({ path: pathname, initial: false, ready: false });
  const initialEntry = arrival.initial && arrival.path === pathname;
  useEffect(() => {
    if (arrival.ready) return;
    let current = true;
    const frame = requestAnimationFrame(() => {
      const transition = (document as Document & { activeViewTransition?: ViewTransition | null })
        .activeViewTransition;
      const done = transition ? transition.finished : Promise.resolve();
      void done
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === 'AbortError')) throw error;
        })
        .finally(() => {
          if (current)
            setArrival((value) => (value.path === pathname ? { ...value, ready: true } : value));
        });
    });
    return () => {
      current = false;
      cancelAnimationFrame(frame);
    };
  }, [pathname, arrival.ready]);
  const reduce = useShouldReduceMotion();
  const animation = (types: string[]) => {
    markRoot();
    return EFFECTS[reduce ? 'fade' : effect](types.includes('nav-back'));
  };
  return (
    <AnimateView
      key={pageKey ?? pathname}
      enter={(types) => animation(types).enter}
      exit={(types) => animation(types).exit}
    >
      <div data-slot="page-transition" className={cn('page-transition', className)} {...props}>
        <style href="motion-view-transition-reset" precedence="default">
          {VIEW_TRANSITION_RESET}
        </style>
        <InitialEntryContext value={initialEntry}>
          <EntryViewportReadyContext value={arrival.ready && arrival.path === pathname}>
            {children}
          </EntryViewportReadyContext>
        </InitialEntryContext>
      </div>
    </AnimateView>
  );
}
