'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { motion, useInView, useMotionValue, useScroll, useTransform } from 'motion/react';
import { ReducedMotionConfig, useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import { usePageVisible } from '@animate-ui/react/utils/use-page-visible';
import Button from '@/components/Button';
import { Pause } from '@/components/icons/pause';
import { Play } from '@/components/icons/play';
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
  const depth = useMotionValue(0);
  const pauseProgress = useMotionValue(0);
  const progress = useTransform(() => (paused ? pauseProgress.get() : scrollYProgress.get()));
  const fieldY = useTransform(() => -progress.get() * depth.get());
  const glowY = useTransform(() => progress.get() * depth.get() * 0.4);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const resize = () => {
      const value = Number.parseFloat(
        getComputedStyle(element).getPropertyValue('--hero-parallax-depth'),
      );
      depth.set(Number.isFinite(value) ? Math.min(64, Math.max(0, value)) : 16);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [depth, root]);
  return { fieldY, glowY, capturePause: () => pauseProgress.set(scrollYProgress.get()) };
}

function Scene({ children }: { children?: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: 0.1 });
  const visible = usePageVisible();
  const reduce = useShouldReduceMotion();
  const [paused, setPaused] = useState(false);
  const [Field, setField] = useState<FieldComponent | null>(null);
  const [failed, setFailed] = useState(false);
  const [rendered, setRendered] = useState(false);
  const unavailable = useCallback(() => setFailed(true), []);
  const onRendered = useCallback((ready: boolean) => setRendered(ready), []);
  const available = inView && visible && !reduce && !failed;
  const active = available && !paused;
  const { fieldY, glowY, capturePause } = useParallax(root, paused);

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
    >
      <motion.div
        className="hero-field-glow"
        initial={false}
        style={available ? { y: glowY } : undefined}
        aria-hidden="true"
      />
      <motion.div
        className="hero-field-art"
        initial={false}
        style={available ? { y: fieldY } : undefined}
      >
        <StaticContourPoster />
        {available && Field && (
          <Field
            interactionRoot={root}
            paused={paused}
            onUnavailable={unavailable}
            onRendered={onRendered}
          />
        )}
      </motion.div>
      {children}
      <div className="hero-field-controls" onPointerEnter={prepare} onFocus={prepare}>
        <Button
          variant="secondary"
          size="sm"
          disabled={reduce || failed}
          aria-pressed={paused}
          onClick={() => {
            capturePause();
            setPaused((value) => !value);
          }}
        >
          {paused || reduce ? (
            <Play data-icon="inline-start" aria-hidden="true" />
          ) : (
            <Pause data-icon="inline-start" aria-hidden="true" />
          )}
          {reduce
            ? 'Bewegung reduziert'
            : failed
              ? 'Ruhige Ansicht'
              : paused
                ? 'Animation fortsetzen'
                : 'Animation pausieren'}
        </Button>
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
