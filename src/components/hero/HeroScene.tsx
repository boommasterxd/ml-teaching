'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { motion, useInView, useMotionValue, useScroll, useTransform } from 'motion/react';
import { ReducedMotionConfig, useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import { usePageVisible } from '@animate-ui/react/utils/use-page-visible';
import Button from '@/components/Button';
import { Pause } from '@/components/icons/pause';
import { Play } from '@/components/icons/play';
import { useHomePlayback } from '@/components/home/HomePlaybackProvider';
import { useEntryViewportReady } from '@/components/ui/entry-policy';
import StaticContourPoster from './StaticContourPoster';

let fieldModule: ReturnType<typeof importField> | undefined;
function importField() {
  return import('./TopographyField');
}
function prepareField() {
  fieldModule ??= importField().catch((error: unknown) => {
    fieldModule = undefined;
    throw error;
  });
  return fieldModule;
}
type FieldComponent = typeof import('./TopographyField').default;

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

function Scene({ children }: { children?: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const artwork = useRef<HTMLDivElement>(null);
  const inView = useInView(artwork, { amount: 0.05 });
  const visible = usePageVisible();
  const reduce = useShouldReduceMotion();
  const viewportReady = useEntryViewportReady();
  const { paused, togglePause } = useHomePlayback();
  const [Field, setField] = useState<FieldComponent | null>(null);
  const [failed, setFailed] = useState(false);
  const [rendered, setRendered] = useState(false);
  const unavailable = useCallback(() => setFailed(true), []);
  const onRendered = useCallback((ready: boolean) => setRendered(ready), []);
  const available = inView && visible && !reduce && !failed;
  const active = available && !paused;
  const { fieldY, capturePause } = useParallax(root, paused);

  useEffect(() => {
    if (!active) return;
    let current = true;
    void prepareField()
      .then((module) => {
        if (current) setField(() => module.default);
      })
      .catch(() => {
        if (current) setFailed(true);
      });
    return () => {
      current = false;
    };
  }, [active]);

  const prepare = () => {
    if (!reduce && !failed) void prepareField().catch(() => {});
  };
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
            style={available ? { y: fieldY } : undefined}
          >
            <StaticContourPoster />
            {viewportReady && available && Field && (
              <Field paused={paused} onUnavailable={unavailable} onRendered={onRendered} />
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

export default function HeroScene({ children }: { children?: ReactNode }) {
  return (
    <ReducedMotionConfig>
      <Scene>{children}</Scene>
    </ReducedMotionConfig>
  );
}
