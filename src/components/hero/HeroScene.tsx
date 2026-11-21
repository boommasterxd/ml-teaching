'use client';

import { useRef, type ReactNode, type RefObject } from 'react';
import { motion, useMotionValue, useScroll, useTransform } from 'motion/react';
import { ReducedMotionConfig } from '@animate-ui/react/utils/motion';
import Button from '@/components/Button';
import { Pause } from '@/components/icons/pause';
import { Play } from '@/components/icons/play';
import { useHomePlayback } from '@/components/home/HomePlaybackProvider';
import { useEntryViewportReady } from '@/components/ui/entry-policy';
import { useGlassField } from './use-glass-field';

type HeroSceneProps = { children?: ReactNode; poster?: ReactNode };

function useParallax(root: RefObject<HTMLDivElement | null>, paused: boolean) {
  const { scrollYProgress } = useScroll({ target: root, offset: ['start start', 'end start'] });
  const pauseProgress = useMotionValue(0);
  const progress = useTransform(() => (paused ? pauseProgress.get() : scrollYProgress.get()));
  const fieldY = useTransform(progress, [0, 1], [0, -24]);
  return { fieldY, capturePause: () => pauseProgress.set(scrollYProgress.get()) };
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

function Scene({ children, poster }: HeroSceneProps) {
  const root = useRef<HTMLDivElement>(null);
  const viewportReady = useEntryViewportReady();
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
  const { fieldY, capturePause } = useParallax(root, paused);

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
            style={available && inView ? { y: fieldY } : undefined}
          >
            {poster}
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
          onToggle={() => {
            capturePause();
            togglePause();
          }}
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
