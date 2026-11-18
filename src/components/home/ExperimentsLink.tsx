'use client';

import type { MouseEvent } from 'react';
import { Button } from '@/components/ui/button';

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
  return (
    <Button asChild variant="outline" size="lg">
      <a href="#lernbereiche" onClick={scrollToExperiments}>
        Mini-Experimente
      </a>
    </Button>
  );
}
