'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from 'react';
import { cancelFrame, frame, useMotionValue, useSpring } from 'motion/react';
import Button from '@/components/Button';
import { GlassImpulses } from './glass-impulses';
import type { GlassShape } from './topography-gl';
import { useTopographyRenderer, type FieldPlayback } from './use-topography-renderer';

interface PointerPoint {
  clientX: number;
  clientY: number;
}

function useFieldMotion(playback: FieldPlayback) {
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const raised = useMotionValue(0);
  const x = useSpring(pointerX, { stiffness: 120, damping: 20 });
  const y = useSpring(pointerY, { stiffness: 120, damping: 20 });
  const lift = useSpring(raised, { stiffness: 80, damping: 18 });
  const playbackValue = useMotionValue(playback);
  const paused = playback !== 'running';
  const wasPaused = useRef(paused);
  const [ripples] = useState(() => new GlassImpulses());
  const values = useMemo(
    () => ({ x, y, lift, ripples, playback: playbackValue }),
    [x, y, lift, ripples, playbackValue],
  );
  useEffect(() => {
    ripples.setPaused(paused);
    if (paused) {
      for (const value of [x, y, lift]) value.stop();
    } else if (wasPaused.current) {
      x.set(pointerX.get());
      y.set(pointerY.get());
      lift.set(raised.get());
    }
    wasPaused.current = paused;
    playbackValue.set(playback);
  }, [paused, playback, playbackValue, ripples, x, y, lift, pointerX, pointerY, raised]);
  useEffect(() => () => ripples.clear(), [ripples]);
  return { values, pointerX, pointerY, raised };
}

function pointInCanvas(canvas: HTMLCanvasElement, point: PointerPoint, fromKeyboard = false) {
  const rect = canvas.getBoundingClientRect();
  return fromKeyboard
    ? { x: rect.width / 2, y: rect.height / 2 }
    : { x: point.clientX - rect.left, y: point.clientY - rect.top };
}

function useFieldPointer(
  canvas: RefObject<HTMLCanvasElement | null>,
  { pointerX, pointerY, raised }: ReturnType<typeof useFieldMotion>,
  paused: boolean,
) {
  const pending = useRef<PointerPoint | null>(null);
  const measure = useCallback(() => {
    const point = pending.current;
    pending.current = null;
    if (!point || !canvas.current || window.getSelection()?.isCollapsed === false) return;
    const { x, y } = pointInCanvas(canvas.current, point);
    pointerX.set(x);
    pointerY.set(y);
    raised.set(1);
  }, [canvas, pointerX, pointerY, raised]);
  const cancelPending = useCallback(() => {
    pending.current = null;
    cancelFrame(measure);
  }, [measure]);
  useLayoutEffect(() => {
    if (!paused) return cancelPending;
  }, [cancelPending, paused]);

  function move({ clientX, clientY, pointerType }: PointerEvent<HTMLButtonElement>) {
    if (paused || pointerType === 'touch') return;
    const shouldSchedule = pending.current === null;
    pending.current = { clientX, clientY };
    if (shouldSchedule) frame.read(measure);
  }

  function leave() {
    cancelPending();
    raised.set(0);
  }

  return { move, leave };
}

/** Animate UI's Topography pointer hills and bounded waves, with explicit animation disposal. */
export default function TopographyField({
  onUnavailable,
  onRendered,
  paused: userPaused = false,
  inView = true,
  shape = 'ring',
  homeStartup = false,
}: {
  onUnavailable: () => void;
  onRendered: (ready: boolean) => void;
  paused?: boolean;
  inView?: boolean;
  shape?: GlassShape;
  homeStartup?: boolean;
}) {
  const surface = useRef<HTMLDivElement>(null);
  const playback = inView ? (userPaused ? 'paused' : 'running') : 'offscreen';
  const paused = playback !== 'running';
  const motion = useFieldMotion(playback);
  const { values } = motion;
  const { ripples } = values;
  const canvas = useTopographyRenderer(
    surface,
    values,
    onUnavailable,
    onRendered,
    shape,
    homeStartup,
  );
  const pointer = useFieldPointer(canvas, motion, paused);

  function sendImpulse(event: MouseEvent<HTMLButtonElement>) {
    const element = canvas.current;
    if (!element || paused || window.getSelection()?.isCollapsed === false) return;
    ripples.send(pointInCanvas(element, event, event.detail === 0));
  }

  return (
    <div className="hero-field-canvas">
      <div ref={surface} className="size-full" aria-hidden="true" />
      <Button
        type="button"
        variant="ghost"
        className="hero-glass-input"
        aria-label="Lichtimpuls im Glas auslösen"
        disabled={paused}
        onPointerMove={pointer.move}
        onPointerLeave={pointer.leave}
        onPointerCancel={pointer.leave}
        onClick={sendImpulse}
      />
    </div>
  );
}
