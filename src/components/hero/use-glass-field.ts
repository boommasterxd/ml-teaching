'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefCallback } from 'react';
import { useInView } from 'motion/react';
import { usePageVisible } from '@animate-ui/react/utils/use-page-visible';
import { deferDecorativeMotion } from '@/lib/experimental-motion';
import { useMotionStart } from '../ui/use-motion-start';
import { useMotionPreference } from '../ui/use-motion-preference';

type FieldComponent = typeof import('./TopographyField').default;

let fieldModule: Promise<typeof import('./TopographyField')> | undefined;
const firstFrameDeadlineMs = 2_000;

function prepareField() {
  fieldModule ??= import('./TopographyField').catch((error: unknown) => {
    fieldModule = undefined;
    throw error;
  });
  return fieldModule;
}

function afterFirstPaint(prepare: () => void) {
  let frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(prepare);
  });
  return () => cancelAnimationFrame(frame);
}

export function useGlassField(
  paused: boolean,
  viewportReady: boolean,
  deferStartup = deferDecorativeMotion,
) {
  const artwork = useRef<HTMLDivElement>(null);
  const inView = useInView(artwork);
  const visible = usePageVisible();
  const { reduce } = useMotionPreference();
  const motionReady = useMotionStart(deferStartup);
  const [interested, setInterested] = useState(false);
  const [Field, setField] = useState<FieldComponent | null>(null);
  const [failed, setFailed] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [startupPoster, setStartupPoster] = useState(false);
  if (paused && !rendered && !startupPoster) setStartupPoster(true);
  const onRendered = useCallback((ready: boolean) => {
    setRendered(ready);
    if (ready) setStartupPoster(false);
  }, []);
  const onUnavailable = useCallback(() => setFailed(true), []);
  const available = visible && !reduce && !failed && (inView || rendered) && (!paused || rendered);
  const active = inView && available && !paused && viewportReady && (motionReady || interested);
  const pending = active && !rendered;
  const showField = viewportReady && available;
  const playbackControl = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const fieldRef = useCallback<RefCallback<HTMLDivElement>>((node) => {
    if (!node) return;
    return () => {
      // React detaches this ref before removing the focused field.
      restoreFocus.current = node.contains(node.ownerDocument.activeElement);
    };
  }, []);

  useLayoutEffect(() => {
    if (showField || !restoreFocus.current) return;
    restoreFocus.current = false;
    const control = playbackControl.current;
    if (control && control.ownerDocument.activeElement === control.ownerDocument.body)
      control.focus({ preventScroll: true });
  }, [showField]);

  useEffect(() => {
    if (!active) return;
    let current = true;
    // Keep shader setup out of the first static paint and the route snapshot.
    const cancel = afterFirstPaint(() => {
      void prepareField()
        .then((module) => {
          if (current) setField(() => module.default);
        })
        .catch(() => {
          if (current) setFailed(true);
        });
    });
    return () => {
      current = false;
      cancel();
    };
  }, [active]);

  useEffect(() => {
    if (!pending) return;
    const deadline = window.setTimeout(onUnavailable, firstFrameDeadlineMs);
    return () => window.clearTimeout(deadline);
  }, [onUnavailable, pending]);

  const prepare = () => {
    if (reduce || failed) return;
    if (deferStartup) setInterested(true);
    void prepareField().catch(() => {});
  };
  return {
    artwork,
    Field: showField ? Field : null,
    fieldRef,
    playbackControl,
    available,
    inView,
    failed,
    showPoster: failed || startupPoster,
    reduce,
    rendered,
    pending,
    onRendered,
    onUnavailable,
    prepare,
  };
}
