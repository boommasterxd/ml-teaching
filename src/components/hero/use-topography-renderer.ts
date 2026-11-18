'use client';

import { useEffect, type RefObject } from 'react';
import { cancelFrame, frame, type MotionValue } from 'motion/react';
import type { GlassImpulses } from './glass-impulses';
import { createTopographyRenderer } from './topography-renderer';

const MAX_RENDER_DPR = 1.5;
const MAX_RASTER_PIXELS = 8_294_400;
const IDLE_FRAME_MS = 1000 / 30;

function idleFrame(time: number) {
  return Math.floor((time + 0.5) / IDLE_FRAME_MS);
}

function resolveRasterDensity(width: number, height: number, maxDimension: number) {
  return Math.min(
    devicePixelRatio || 1,
    MAX_RENDER_DPR,
    Math.sqrt(MAX_RASTER_PIXELS / Math.max(1, width * height)),
    maxDimension / Math.max(1, width, height),
  );
}

function resizeRaster(canvas: HTMLCanvasElement, maxDimension: number) {
  const { width, height } = canvas.getBoundingClientRect();
  const dpr = resolveRasterDensity(width, height, maxDimension);
  const rasterWidth = Math.max(1, Math.floor(width * dpr));
  const rasterHeight = Math.max(1, Math.floor(height * dpr));
  if (canvas.width !== rasterWidth) canvas.width = rasterWidth;
  if (canvas.height !== rasterHeight) canvas.height = rasterHeight;
  return { width, height, dpr };
}

export interface FieldMotion {
  x: MotionValue<number>;
  y: MotionValue<number>;
  lift: MotionValue<number>;
  ripples: GlassImpulses;
  running: MotionValue<boolean>;
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
    let size = resizeRaster(canvas, renderer.maxRasterDimension);
    ripples.setCapacity(renderer.rippleCapacity);
    const rippleData = new Float32Array(renderer.rippleCapacity * 4);
    let time = 0;
    let clockOrigin: number | undefined;
    let painted = false;
    let retired = false;
    const centerPointer = () => {
      if (lift.get() === 0) {
        x.jump(size.width / 2);
        y.jump(size.height / 2);
      }
    };
    const resize = () => {
      const next = resizeRaster(canvas, renderer.maxRasterDimension);
      if (size.width === next.width && size.height === next.height && size.dpr === next.dpr) return;
      size = next;
      centerPointer();
      if (painted || running.get()) draw();
    };
    const draw = () => {
      rippleData.fill(0);
      let offset = 0;
      for (const ripple of ripples.active) {
        rippleData[offset++] = ripple.x;
        rippleData[offset++] = ripple.y;
        rippleData[offset++] = ripple.progress.get();
        rippleData[offset++] = 1;
      }
      const drawn = renderer.draw({
        ...size,
        time,
        lift: lift.get() * 1.5,
        hill: [x.get(), y.get()],
        ripples: rippleData,
      });
      if (drawn === false) unavailable();
      else if (drawn === true && !painted) {
        painted = true;
        onRendered(true);
      }
    };
    const tick = ({ timestamp }: { timestamp: number }) => {
      if (retired || !running.get()) return;
      if (!painted || clockOrigin === undefined) clockOrigin = timestamp - time;
      const elapsed = timestamp - clockOrigin;
      const idle = lift.get() === 0 && ripples.active.size === 0;
      if (painted && idle && idleFrame(elapsed) === idleFrame(time)) return;
      time = elapsed;
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const stop = () => {
      if (retired) return;
      retired = true;
      cancelFrame(tick);
      unsubscribe();
      observer.disconnect();
      canvas.removeEventListener('webglcontextlost', unavailable);
      renderer.dispose();
      onRendered(false);
    };
    const unavailable = (event?: Event) => {
      event?.preventDefault();
      stop();
      onUnavailable();
    };
    canvas.addEventListener('webglcontextlost', unavailable);
    const unsubscribe = running.on('change', (active) => {
      if (!active) cancelFrame(tick);
      else {
        clockOrigin = undefined;
        frame.render(tick, true);
      }
    });
    centerPointer();
    draw();
    if (!retired && running.get()) frame.render(tick, true);
    return stop;
  }, [canvasRef, x, y, lift, ripples, running, onUnavailable, onRendered]);
}
