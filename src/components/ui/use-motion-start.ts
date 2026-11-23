'use client';

import { useSyncExternalStore } from 'react';
import { deferDecorativeMotion } from '@/lib/experimental-motion';

const listeners = new Set<() => void>();
let ready = false;
let prepare: (() => void) | undefined;

function afterDocumentPaint(callback: () => void) {
  let frame = 0;
  let idle = 0;
  const paint = () => {
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (typeof window.requestIdleCallback === 'function') {
          idle = window.requestIdleCallback(callback, { timeout: 800 });
        } else callback();
      });
    });
  };
  if (document.readyState === 'complete') paint();
  else window.addEventListener('load', paint, { once: true });
  return () => {
    window.removeEventListener('load', paint);
    cancelAnimationFrame(frame);
    if (idle) window.cancelIdleCallback(idle);
  };
}

function subscribe(listener: () => void) {
  if (ready) return unsubscribe;
  listeners.add(listener);
  prepare ??= afterDocumentPaint(() => {
    ready = true;
    prepare = undefined;
    for (const notify of listeners) notify();
  });
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && prepare) {
      prepare();
      prepare = undefined;
    }
  };
}

const unsubscribe = () => {};
const skip = () => unsubscribe;
const deferredSnapshot = () => ready;
const immediateSnapshot = () => true;
const serverSnapshot = () => false;

export function useMotionStart(deferStartup = deferDecorativeMotion) {
  return useSyncExternalStore(
    deferStartup ? subscribe : skip,
    deferStartup ? deferredSnapshot : immediateSnapshot,
    serverSnapshot,
  );
}
