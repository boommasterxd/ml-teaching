'use client';

import type { MouseEvent } from 'react';
import { useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import { Button } from '@/components/ui/button';
import { prepareExample } from '@/components/network/prepare-example';
import { useHomePlayback } from './HomePlaybackProvider';
import { prepareHomePreviews } from './prepare-home-previews';

function scrollToExperiments(event: MouseEvent<HTMLAnchorElement>) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return;

  const { hash } = event.currentTarget;
  const target = document.getElementById(hash.slice(1));
  if (!target) return;

  event.preventDefault();
  if (window.location.hash !== hash) window.history.pushState(null, '', hash);
  target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior: 'smooth' });
}

export default function ExperimentsLink() {
  const reduce = useShouldReduceMotion();
  const { paused } = useHomePlayback();
  const prepare = () => {
    if (reduce || paused) return;
    void Promise.all([prepareHomePreviews(), prepareExample('dog')]).catch(() => {});
  };

  return (
    <Button
      variant="outline"
      size="lg"
      render={
        <a
          href="#lernbereiche"
          onClick={scrollToExperiments}
          onPointerEnter={prepare}
          onFocus={prepare}
          onPointerDown={prepare}
        />
      }
    >
      Mini-Experimente
    </Button>
  );
}
