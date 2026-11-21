'use client';

import { useEffect, type RefObject } from 'react';
import { cancelFrame, frame, type MotionValue } from 'motion/react';
import type { GlassImpulses } from './glass-impulses';
import { contourMedia } from './contour-poster';
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

export type FieldPlayback = 'running' | 'paused' | 'offscreen';

export interface FieldMotion {
  x: MotionValue<number>;
  y: MotionValue<number>;
  lift: MotionValue<number>;
  ripples: GlassImpulses;
  playback: MotionValue<FieldPlayback>;
}

function centerPointer(
  { x, y, lift }: FieldMotion,
  { width, height }: { width: number; height: number },
) {
  if (lift.get() !== 0) return;
  x.jump(width / 2);
  y.jump(height / 2);
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
  sharpDesktopStart: boolean,
) {
  useEffect(() => {
    const { x, y, lift, ripples, playback } = values;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = createTopographyRenderer(canvas, shape);
    if (!renderer) return onUnavailable();
    const quality = createTopographyQuality(
      sharpDesktopStart && window.matchMedia(contourMedia.desktop).matches,
    );
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
    let resizePending = false;
    const resize = () => {
      resizePending = playback.get() === 'offscreen';
      if (resizePending) return;
      bounds = canvas.getBoundingClientRect();
      const next = updateRaster();
      if (size.width === next.width && size.height === next.height && size.dpr === next.dpr) return;
      size = next;
      quality.resetSamples();
      centerPointer(values, size);
      if (painted || playback.get() === 'running') draw();
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
      if (retired || playback.get() !== 'running') return;
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
    const unsubscribe = playback.on('change', (state) => {
      if (resizePending && state !== 'offscreen') resize();
      if (retired) return;
      if (state !== 'running') cancelFrame(tick);
      else {
        clockOrigin = undefined;
        quality.resetSamples();
        frame.render(tick, true);
      }
    });
    centerPointer(values, size);
    draw();
    if (!retired && playback.get() === 'running') frame.render(tick, true);
    return stop;
  }, [canvasRef, values, onUnavailable, onRendered, shape, sharpDesktopStart]);
}
