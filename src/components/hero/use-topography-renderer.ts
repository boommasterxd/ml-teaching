'use client';

import { useEffect, type RefObject } from 'react';
import { cancelFrame, frame, type MotionValue } from 'motion/react';
import type { GlassImpulses } from './glass-impulses';
import type { GlassShape } from './topography-gl';
import { createTopographyRenderer } from './topography-renderer';
import { createTopographyQuality, type TopographyQuality } from './topography-quality';

const IDLE_FRAME_MS = 1000 / 30;

function idleFrame(time: number) {
  return Math.floor((time + 0.5) / IDLE_FRAME_MS);
}

function resizeRaster(
  canvas: HTMLCanvasElement,
  { width, height }: { width: number; height: number },
  maxDimension: number,
  quality: TopographyQuality,
) {
  const dpr = Math.min(
    devicePixelRatio || 1,
    quality.dpr,
    Math.sqrt(quality.rasterPixels / Math.max(1, width * height)),
    maxDimension / Math.max(1, width, height),
  );
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

function observeCanvasSize(canvas: HTMLCanvasElement, resize: () => void) {
  const observer = new ResizeObserver(resize);
  const watchesDevicePixels =
    typeof ResizeObserverEntry !== 'undefined' &&
    'devicePixelContentBoxSize' in ResizeObserverEntry.prototype;
  observer.observe(canvas, {
    box: watchesDevicePixels ? 'device-pixel-content-box' : 'content-box',
  });
  if (!watchesDevicePixels) window.addEventListener('resize', resize);
  return () => {
    observer.disconnect();
    if (!watchesDevicePixels) window.removeEventListener('resize', resize);
  };
}

function packRipples(ripples: GlassImpulses, target: Float32Array) {
  target.fill(0);
  let offset = 0;
  for (const ripple of ripples.active) {
    target[offset++] = ripple.x;
    target[offset++] = ripple.y;
    target[offset++] = ripple.progress.get();
    target[offset++] = 1;
  }
  return target;
}

/** Retains the GPU image while paused and schedules frames only for an active scene. */
export function useTopographyRenderer(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  values: FieldMotion,
  onUnavailable: () => void,
  onRendered: (ready: boolean) => void,
  shape: GlassShape,
) {
  const { x, y, lift, ripples, running } = values;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = createTopographyRenderer(canvas, shape);
    if (!renderer) {
      onUnavailable();
      return;
    }
    const quality = createTopographyQuality();
    let bounds = canvas.getBoundingClientRect();
    const updateRaster = () =>
      resizeRaster(canvas, bounds, renderer.maxRasterDimension, quality.current);
    let size = updateRaster();
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
      bounds = canvas.getBoundingClientRect();
      const next = updateRaster();
      if (size.width === next.width && size.height === next.height && size.dpr === next.dpr) return;
      size = next;
      quality.resetSamples();
      centerPointer();
      if (painted || running.get()) draw();
    };
    const draw = () => {
      const drawn = renderer.draw({
        ...size,
        fieldScale: quality.current.fieldScale,
        fieldTexels: quality.current.fieldTexels,
        time,
        lift: lift.get() * 1.5,
        hill: [x.get(), y.get()],
        ripples: packRipples(ripples, rippleData),
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
      const qualityChanged = painted && quality.sample(timestamp);
      if (qualityChanged) size = updateRaster();
      const idle = lift.get() === 0 && ripples.active.size === 0;
      if (!qualityChanged && painted && idle && idleFrame(elapsed) === idleFrame(time)) return;
      time = elapsed;
      draw();
    };
    const unobserve = observeCanvasSize(canvas, resize);
    const stop = () => {
      if (retired) return;
      retired = true;
      cancelFrame(tick);
      unsubscribe();
      unobserve();
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
        quality.resetSamples();
        frame.render(tick, true);
      }
    });
    centerPointer();
    draw();
    if (!retired && running.get()) frame.render(tick, true);
    return stop;
  }, [canvasRef, x, y, lift, ripples, running, onUnavailable, onRendered, shape]);
}
