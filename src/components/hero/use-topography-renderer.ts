'use client';

import { useEffect, type RefObject } from 'react';
import { cancelFrame, frame, type MotionValue } from 'motion/react';
import { createTopographyRenderer } from './topography-renderer';

const MAX_RENDER_DPR = 1.5;

export interface FieldRipple {
  x: number;
  y: number;
  progress: MotionValue<number>;
  stop: () => void;
  pause: () => void;
  play: () => void;
}

export interface FieldMotion {
  x: MotionValue<number>;
  y: MotionValue<number>;
  lift: MotionValue<number>;
  ripples: RefObject<FieldRipple[]>;
  running: MotionValue<boolean>;
}

function readLineColor(canvas: HTMLCanvasElement): [number, number, number] {
  const values = getComputedStyle(canvas)
    .getPropertyValue('--hero-line-color')
    .trim()
    .split(/\s+/)
    .map(Number);
  if (
    values.length !== 3 ||
    values.some((value) => !Number.isFinite(value) || value < 0 || value > 255)
  )
    return [0.79, 0.14, 0.22];
  return [values[0]! / 255, values[1]! / 255, values[2]! / 255];
}

/** Retains the GPU image while paused and schedules frames only for an active scene. */
export function useTopographyRenderer(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  values: FieldMotion,
  onUnavailable: () => void,
  onRendered: (ready: boolean) => void,
) {
  const { x, y, lift, ripples, running } = values;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = createTopographyRenderer(canvas);
    if (!renderer) {
      onUnavailable();
      return;
    }
    const size = { width: 0, height: 0, dpr: 1 };
    const rippleData = new Float32Array(16);
    let time = 0;
    let resuming = false;
    let painted = false;
    let color = readLineColor(canvas);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      size.width = rect.width;
      size.height = rect.height;
      size.dpr = Math.max(1, Math.min(devicePixelRatio || 1, MAX_RENDER_DPR));
      canvas.width = Math.max(1, Math.round(size.width * size.dpr));
      canvas.height = Math.max(1, Math.round(size.height * size.dpr));
      if (lift.get() === 0) {
        x.jump(size.width / 2);
        y.jump(size.height / 2);
      }
      if (painted && !running.get()) tick({ delta: 0 });
    };
    const tick = ({ delta }: { delta: number }) => {
      if (delta && !running.get()) return true;
      time += resuming ? 0 : Math.min(delta, 64);
      resuming = false;
      rippleData.fill(0);
      ripples.current.forEach((ripple, index) => {
        rippleData.set([ripple.x, ripple.y, ripple.progress.get(), 1], index * 4);
      });
      return renderer.draw({
        ...size,
        time,
        color,
        lift: lift.get() * 1.5,
        hill: [x.get(), y.get()],
        ripples: rippleData,
      });
    };
    resize();
    if (!tick({ delta: 0 })) {
      renderer.dispose();
      onRendered(false);
      onUnavailable();
      return;
    }
    painted = true;
    onRendered(true);
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const themeObserver = new MutationObserver(() => {
      color = readLineColor(canvas);
      tick({ delta: 0 });
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    let retired = false;
    const stop = () => {
      if (retired) return;
      retired = true;
      cancelFrame(tick);
      unsubscribe();
      observer.disconnect();
      themeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', unavailable);
      renderer.dispose();
      onRendered(false);
    };
    const unavailable = (event: Event) => {
      event.preventDefault();
      stop();
      onUnavailable();
    };
    canvas.addEventListener('webglcontextlost', unavailable);
    const unsubscribe = running.on('change', (active) => {
      if (!active) cancelFrame(tick);
      else {
        resuming = true;
        frame.render(tick, true);
      }
    });
    if (running.get()) frame.render(tick, true);
    return stop;
  }, [canvasRef, x, y, lift, ripples, running, onUnavailable, onRendered]);
}
