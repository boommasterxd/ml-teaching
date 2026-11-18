'use client';

import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import {
  motionTokens,
  useShouldReduceMotion,
  useTempoTransition,
} from '@animate-ui/react/utils/motion';

function subscribeToScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
}

function readScrolled() {
  return window.scrollY > 0;
}

function readStaticScroll() {
  return null;
}

function HomeHeaderSurface() {
  const scrolled = useSyncExternalStore<boolean | null>(
    subscribeToScroll,
    readScrolled,
    readStaticScroll,
  );
  const reduce = useShouldReduceMotion();
  const transition = useTempoTransition(motionTokens.transition.fade);
  const position = scrolled === null ? 'initial' : scrolled ? 'scrolled' : 'top';

  return (
    <Effect
      asChild
      initial={false}
      animate={scrolled === null ? undefined : { opacity: scrolled ? 1 : 0 }}
      transition={reduce ? { duration: 0 } : transition}
    >
      <div className="site-header-surface" aria-hidden="true" data-home-header-surface={position} />
    </Effect>
  );
}

export default function SiteHeaderSurface() {
  if (usePathname() === '/') return <HomeHeaderSurface />;
  return <div className="site-header-surface" aria-hidden="true" />;
}
