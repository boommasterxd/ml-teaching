'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { ReducedMotionConfig, useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import ErrorGlassFrame from './ErrorGlassFrame';

type Playback = typeof import('./ErrorGlassPlayback');

let pending: Promise<Playback> | undefined;

function preparePlayback() {
  pending ??= import('./ErrorGlassPlayback').catch((error: unknown) => {
    pending = undefined;
    throw error;
  });
  return pending;
}

function ErrorGlassPoster({ digits }: { digits: boolean }) {
  const viewport = useRef<HTMLDivElement>(null);
  const inView = useInView(viewport, { amount: 0.05 });
  const reduce = useShouldReduceMotion();
  const [Playback, setPlayback] = useState<Playback['default'] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!inView || reduce || Playback) return;
    let active = true;
    void preparePlayback().then(
      (module) => {
        if (active) setPlayback(() => module.default);
      },
      () => {
        if (active) setFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [inView, reduce, Playback]);

  return (
    <div ref={viewport} className="error-glass">
      {Playback ? (
        <Playback digits={digits} />
      ) : (
        <>
          <ErrorGlassFrame digits={digits} data-field-unavailable={failed || undefined} />
          <div className="error-glass-controls" />
        </>
      )}
    </div>
  );
}

/** Shared error documents paint their poster before loading optional playback. */
export default function ErrorGlassArtwork({ digits }: { digits: boolean }) {
  return (
    <ReducedMotionConfig>
      <ErrorGlassPoster digits={digits} />
    </ReducedMotionConfig>
  );
}
