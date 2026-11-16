'use client';

import { useEffect, useMemo, useRef, type PointerEvent } from 'react';
import { animate, motionValue, useMotionValue, useSpring } from 'motion/react';
import { useTopographyRenderer, type FieldRipple } from './use-topography-renderer';

/** Animate UI's Topography pointer hills and bounded waves, with explicit animation disposal. */
export default function TopographyField({
  onUnavailable,
  onRendered,
  paused = false,
}: {
  onUnavailable: () => void;
  onRendered: (ready: boolean) => void;
  paused?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const raised = useMotionValue(0);
  const x = useSpring(pointerX, { stiffness: 120, damping: 20 });
  const y = useSpring(pointerY, { stiffness: 120, damping: 20 });
  const lift = useSpring(raised, { stiffness: 80, damping: 18 });
  const running = useMotionValue(!paused);
  const wasPaused = useRef(paused);
  const ripples = useRef<FieldRipple[]>([]);
  const values = useMemo(() => ({ x, y, lift, ripples, running }), [x, y, lift, running]);
  useTopographyRenderer(canvas, values, onUnavailable, onRendered);
  useEffect(() => {
    running.set(!paused);
    if (paused) {
      for (const value of [x, y, lift]) value.stop();
      for (const ripple of ripples.current) ripple.pause();
    } else if (wasPaused.current) {
      x.set(pointerX.get());
      y.set(pointerY.get());
      lift.set(raised.get());
      for (const ripple of ripples.current) ripple.play();
    }
    wasPaused.current = paused;
  }, [paused, running, x, y, lift, pointerX, pointerY, raised]);
  useEffect(
    () => () => {
      for (const ripple of ripples.current) {
        ripple.stop();
        ripple.progress.destroy();
      }
      ripples.current = [];
    },
    [],
  );

  const point = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const next = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    pointerX.set(next.x);
    pointerY.set(next.y);
    return next;
  };
  const wave = (event: PointerEvent<HTMLDivElement>) => {
    const next = point(event);
    if (ripples.current.length === 4) {
      const retired = ripples.current.shift()!;
      retired.stop();
      retired.progress.destroy();
    }
    const progress = motionValue(0);
    const control = animate(progress, 1, { duration: 2.6, ease: [0.25, 0.4, 0.45, 1] });
    const ripple = {
      ...next,
      progress,
      stop: () => control.stop(),
      pause: () => control.pause(),
      play: () => control.play(),
    };
    ripples.current.push(ripple);
    void control.then(() => {
      ripples.current = ripples.current.filter((active) => active !== ripple);
      progress.destroy();
    });
  };

  return (
    <div
      className="hero-field-canvas"
      aria-hidden="true"
      onPointerMove={(event) => {
        if (paused) return;
        point(event);
        raised.set(1);
      }}
      onPointerLeave={() => {
        if (!paused) raised.set(0);
      }}
      onPointerDown={paused ? undefined : wave}
    >
      <canvas ref={canvas} className="size-full" />
    </div>
  );
}
