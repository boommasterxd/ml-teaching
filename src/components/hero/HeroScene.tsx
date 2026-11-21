'use client';

import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  type MotionValue,
} from 'motion/react';
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

function HeroParallax({
  root,
  paused,
  offset,
}: {
  root: RefObject<HTMLDivElement | null>;
  paused: boolean;
  offset: MotionValue<number>;
}) {
  const { scrollYProgress } = useScroll({ target: root, offset: ['start start', 'end start'] });
  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    if (!paused) offset.set(-24 * progress);
  });
  useEffect(() => {
    if (!paused) offset.set(-24 * scrollYProgress.get());
  }, [offset, paused, scrollYProgress]);
  return null;
}

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
        aria-pressed={paused}
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
    onRendered,
    onUnavailable,
    prepare,
  } = useGlassField(paused, viewportReady, { waitForDocumentLoad: false, retainOffscreen: true });
  const fieldY = useMotionValue(0);

  return (
    <div
      ref={root}
      className="hero-field"
      data-enhanced={(available && rendered) || undefined}
      data-paused={paused || reduce || undefined}
      data-field-unavailable={failed || undefined}
    >
      {motionReady && <HeroParallax root={root} paused={paused} offset={fieldY} />}
      <div className="hero-field-backdrop" aria-hidden="true" />
      <div className="landing-container hero-composition">
        {children}
        <div ref={artwork} id="home-hero-art" className="hero-optics" onPointerEnter={prepare}>
          <motion.div
            className="hero-field-art"
            initial={false}
            style={motionReady && available && inView ? { y: fieldY } : undefined}
          >
            <GlassArtworkPlaceholder
              sources={sources}
              fallback={failed || (paused && !rendered)}
              pending={!rendered && !reduce && !paused}
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
