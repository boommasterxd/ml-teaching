'use client';

import { useSyncExternalStore } from 'react';
import { useReducedMotionSetting } from '@animate-ui/react/utils/motion';
import { reducedMotionMedia } from '@/lib/media-queries';
const listeners = new Set<() => void>();
let media: MediaQueryList | undefined;

function getMedia() {
  return (media ??= window.matchMedia(reducedMotionMedia));
}

function notify() {
  for (const listener of [...listeners]) listener();
}

function subscribe(listener: () => void) {
  const current = getMedia();
  if (listeners.size === 0) current.addEventListener('change', notify);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    current.removeEventListener('change', notify);
    media = undefined;
  };
}

const snapshot = () => getMedia().matches;
const serverSnapshot = () => false;
const unsubscribe = () => {};
const skip = () => unsubscribe;

/** Read Animate UI's local setting with one live browser subscription across these callers. */
export function useMotionPreference() {
  const preference = useReducedMotionSetting();
  const system = useSyncExternalStore(
    preference === 'user' ? subscribe : skip,
    preference === 'user' ? snapshot : serverSnapshot,
    serverSnapshot,
  );
  return { preference, reduce: preference === 'always' || system };
}
