'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { scroll } from 'motion';
import { motion, useMotionValue } from 'motion/react';
import { ReducedMotionConfig } from '@animate-ui/react/utils/motion';
import Button from '@/components/Button';
import { Pause } from '@/components/icons/pause';
import { Play } from '@/components/icons/play';
import { useHomePlayback } from '@/components/home/HomePlaybackProvider';
import { useEntryViewportReady } from '@/components/ui/entry-policy';
import { useMotionStart } from '@/components/ui/use-motion-start';
import { useGlassField } from './use-glass-field';

import GlassArtworkPlaceholder from './GlassArtworkPlaceholder';
import type { ContourSources } from './contour-poster';

type HeroSceneProps = { children?: ReactNode; sources: ContourSources };

function PlaybackControl({
  reduce,
  paused,
  onToggle,
  onIntent,
}: {
  reduce: boolean;
  paused: boolean;
  onToggle: () => void;
  onIntent: () => void;
}) {
  const Icon = paused || reduce ? Play : Pause;
  return (
    <div className="hero-field-controls" onPointerEnter={onIntent} onFocus={onIntent}>
      <Button
        variant="outline"
        size="sm"
        disabled={reduce}
        aria-controls="home-hero-art lernbereiche"
        onClick={onToggle}
      >
        <Icon data-icon="inline-start" aria-hidden="true" />
        {reduce
          ? 'Bewegung reduziert'
          : paused
            ? 'Animationen fortsetzen'
            : 'Animationen pausieren'}
      </Button>
    </div>
  );
}

function Scene({ children, sources }: HeroSceneProps) {
  const root = useRef<HTMLDivElement>(null);
  const viewportReady = useEntryViewportReady();
  const motionReady = useMotionStart();
  const { paused, togglePause } = useHomePlayback();
  const {
    artwork,
    Field,
    available,
    inView,
    failed,
    reduce,
    rendered,
    pending,
    onRendered,
    onUnavailable,
    prepare,
  } = useGlassField(paused, viewportReady);
  const fieldY = useMotionValue(0);
  const parallaxVisible = motionReady && viewportReady && available && inView;
  const parallaxRunning = parallaxVisible && !paused;

  useEffect(() => {
    const target = root.current;
    if (!parallaxRunning || !target) return;
    // Keep the previous offset until Motion measures the current scroll position.
    return scroll((progress) => fieldY.set(-24 * progress), {
      target,
      offset: ['start start', 'end start'],
    });
  }, [fieldY, parallaxRunning]);

  return (
    <div
      ref={root}
      className="hero-field"
      data-enhanced={(available && rendered) || undefined}
      data-paused={paused || reduce || undefined}
      data-field-unavailable={failed || undefined}
    >
      <div className="hero-field-backdrop" aria-hidden="true" />
      <div className="landing-container hero-composition">
        {children}
        <div ref={artwork} id="home-hero-art" className="hero-optics" onPointerEnter={prepare}>
          <motion.div
            className="hero-field-art"
            initial={false}
            style={parallaxVisible ? { y: fieldY } : undefined}
          >
            <GlassArtworkPlaceholder
              sources={sources}
              fallback={failed || (paused && !rendered)}
              pending={pending}
            />
            {viewportReady && available && Field && (
              <Field
                sharpDesktopStart
                paused={paused}
                inView={inView}
                onUnavailable={onUnavailable}
                onRendered={onRendered}
              />
            )}
          </motion.div>
        </div>
        <PlaybackControl
          reduce={reduce}
          paused={paused}
          onIntent={prepare}
          onToggle={togglePause}
        />
      </div>
    </div>
  );
}

export default function HeroScene(props: HeroSceneProps) {
  return (
    <ReducedMotionConfig>
      <Scene {...props} />
    </ReducedMotionConfig>
  );
}
