'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useMotionValue, useSpring } from 'motion/react';
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

/** Animate UI's Topography pointer hills and bounded waves, with explicit animation disposal. */
export default function TopographyField({
  onUnavailable,
  onRendered,
  paused: userPaused = false,
  inView = true,
  shape = 'ring',
  sharpDesktopStart = false,
}: {
  onUnavailable: () => void;
  onRendered: (ready: boolean) => void;
  paused?: boolean;
  inView?: boolean;
  shape?: GlassShape;
  sharpDesktopStart?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const playback = inView ? (userPaused ? 'paused' : 'running') : 'offscreen';
  const paused = playback !== 'running';
  const { values, pointerX, pointerY, raised } = useFieldMotion(playback);
  const { ripples } = values;
  useTopographyRenderer(canvas, values, onUnavailable, onRendered, shape, sharpDesktopStart);
  function point(event: PointerPoint, fromKeyboard = false) {
    const rect = canvas.current!.getBoundingClientRect();
    return fromKeyboard
      ? { x: rect.width / 2, y: rect.height / 2 }
      : { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function sendImpulse(event: MouseEvent<HTMLButtonElement>) {
    if (paused || window.getSelection()?.isCollapsed === false) return;
    ripples.send(point(event, event.detail === 0));
  }

  return (
    <div className="hero-field-canvas">
      <canvas ref={canvas} className="size-full" aria-hidden="true" />
      <Button
        type="button"
        variant="ghost"
        className="hero-glass-input"
        aria-label="Lichtimpuls im Glas auslösen"
        disabled={paused}
        onPointerMove={(event) => {
          if (
            paused ||
            event.pointerType === 'touch' ||
            window.getSelection()?.isCollapsed === false
          )
            return;
          const { x, y } = point(event);
          pointerX.set(x);
          pointerY.set(y);
          raised.set(1);
        }}
        onPointerLeave={() => raised.set(0)}
        onPointerCancel={() => raised.set(0)}
        onClick={sendImpulse}
      />
    </div>
  );
}
