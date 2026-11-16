'use client';

import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react';
import { animate, motionValue, useMotionValue, useSpring } from 'motion/react';
import { useTopographyRenderer, type FieldRipple } from './use-topography-renderer';

interface PointerPoint {
  clientX: number;
  clientY: number;
}
type SurfacePointer = PointerPoint & { target: EventTarget | null; pointerType?: string };
interface PointerActions {
  move: (event: PointerPoint) => void;
  down: (event: PointerPoint) => void;
  leave: () => void;
}

function acceptsPointer(event: SurfacePointer) {
  const target =
    event.target instanceof Element
      ? event.target
      : event.target instanceof Node
        ? event.target.parentElement
        : null;
  return (
    !target?.closest(
      'a, button, input, select, textarea, [role="button"], [role="switch"], [role="checkbox"], [contenteditable], [data-hero-no-interaction]',
    ) && window.getSelection()?.isCollapsed !== false
  );
}

/** Decorative input never captures pointers or prevents native touch scrolling. */
function usePointerSurface(
  root: RefObject<HTMLDivElement | null> | undefined,
  paused: boolean,
  actions: PointerActions,
) {
  const handlers = useMemo(
    () => ({
      onPointerMove: (event: SurfacePointer) => {
        if (!paused && event.pointerType !== 'touch' && acceptsPointer(event)) actions.move(event);
      },
      onPointerDown: (event: SurfacePointer) => {
        if (!paused && acceptsPointer(event)) actions.down(event);
      },
      onPointerLeave: () => {
        if (!paused) actions.leave();
      },
    }),
    [paused, actions],
  );
  useEffect(() => {
    const element = root?.current;
    if (!element) return;
    element.addEventListener('pointermove', handlers.onPointerMove, { passive: true });
    element.addEventListener('pointerdown', handlers.onPointerDown, { passive: true });
    element.addEventListener('pointerleave', handlers.onPointerLeave, { passive: true });
    element.addEventListener('pointercancel', handlers.onPointerLeave, { passive: true });
    return () => {
      element.removeEventListener('pointermove', handlers.onPointerMove);
      element.removeEventListener('pointerdown', handlers.onPointerDown);
      element.removeEventListener('pointerleave', handlers.onPointerLeave);
      element.removeEventListener('pointercancel', handlers.onPointerLeave);
    };
  }, [root, handlers]);
  return root ? {} : handlers;
}

function useFieldMotion(paused: boolean) {
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
  return { values, pointerX, pointerY, raised };
}

/** Animate UI's Topography pointer hills and bounded waves, with explicit animation disposal. */
export default function TopographyField({
  onUnavailable,
  onRendered,
  paused = false,
  interactionRoot,
}: {
  onUnavailable: () => void;
  onRendered: (ready: boolean) => void;
  paused?: boolean;
  interactionRoot?: RefObject<HTMLDivElement | null>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { values, pointerX, pointerY, raised } = useFieldMotion(paused);
  const { ripples } = values;
  useTopographyRenderer(canvas, values, onUnavailable, onRendered);
  const point = useCallback(
    (event: PointerPoint) => {
      const rect = canvas.current!.getBoundingClientRect();
      const next = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      pointerX.set(next.x);
      pointerY.set(next.y);
      return next;
    },
    [pointerX, pointerY],
  );
  const wave = useCallback(
    (event: PointerPoint) => {
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
    },
    [point, ripples],
  );
  const actions = useMemo(
    () => ({
      move: (event: PointerPoint) => {
        point(event);
        raised.set(1);
      },
      down: wave,
      leave: () => raised.set(0),
    }),
    [point, raised, wave],
  );
  const handlers = usePointerSurface(interactionRoot, paused, actions);

  return (
    <div className="hero-field-canvas" aria-hidden="true" {...handlers}>
      <canvas ref={canvas} className="size-full" />
    </div>
  );
}
