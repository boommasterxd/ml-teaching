'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { animate } from 'motion/mini';
import { motionTokens } from '@animate-ui/react/utils/motion';
import { useEntryViewportReady } from './ui/entry-policy';
import { useMotionPreference } from './ui/use-motion-preference';

const sectionSelector = '.legal-reading-section';

/** One observer admits the server-rendered reading groups without hydrating a Motion tree per group. */
export default function LegalReadingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const admitted = useRef(new WeakSet<Element>());
  const viewportReady = useEntryViewportReady();
  const { reduce } = useMotionPreference();

  useEffect(() => {
    const container = root.current;
    if (!container || !viewportReady || reduce || typeof IntersectionObserver === 'undefined')
      return;

    const seen = admitted.current;
    const belowFold = new WeakSet<Element>();
    const running = new Map<Element, ReturnType<typeof animate>>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting, boundingClientRect } of entries) {
          const section = target as HTMLElement;
          if (!belowFold.has(section) && boundingClientRect.top >= window.innerHeight) {
            belowFold.add(section);
            section.dataset.entryAdmission = 'scroll';
            continue;
          }
          if (belowFold.has(section) && !isIntersecting) continue;
          observer.unobserve(section);
          if (seen.has(section)) continue;
          seen.add(section);
          if (!belowFold.has(section) || section.matches(':focus-within')) continue;
          const playback = animate(
            section,
            { transform: ['translateY(14px)', 'none'] },
            motionTokens.transition.reveal,
          );
          running.set(section, playback);
          void playback.then(() => running.delete(section));
        }
      },
      { rootMargin: '0px 0px -12px' },
    );

    function revealFocused(event: FocusEvent) {
      const section = event.target instanceof Element && event.target.closest(sectionSelector);
      if (!section) return;
      seen.add(section);
      observer.unobserve(section);
      running.get(section)?.cancel();
      running.delete(section);
    }

    for (const section of container.querySelectorAll(sectionSelector)) {
      if (!seen.has(section)) observer.observe(section);
    }
    container.addEventListener('focusin', revealFocused);
    return () => {
      container.removeEventListener('focusin', revealFocused);
      observer.disconnect();
      for (const playback of running.values()) playback.cancel();
      running.clear();
    };
  }, [reduce, viewportReady]);

  return (
    <div ref={root} className="contents">
      {children}
    </div>
  );
}
