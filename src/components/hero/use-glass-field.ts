'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefCallback } from 'react';
import { useInView } from 'motion/react';
import { usePageVisible } from '@animate-ui/react/utils/use-page-visible';
import { createRetryableLoader } from '@/lib/create-retryable-loader';
import { useMotionStart } from '../ui/use-motion-start';
import { useMotionPreference } from '../ui/use-motion-preference';

type FieldComponent = typeof import('./TopographyField').default;
export type GlassReveal = 'waiting' | 'fade' | 'ready';
type FirstFrame = { phase: GlassReveal | 'loading'; startupPoster: boolean };

const prepareField = createRetryableLoader(() => import('./TopographyField'));
const loadingDelayMs = 500;
const firstFrameDeadlineMs = 2_000;

function afterFirstPaint(prepare: () => void) {
  let frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(prepare);
  });
  return () => cancelAnimationFrame(frame);
}

function useFirstFrame(active: boolean, paused: boolean, onUnavailable: () => void) {
  const [{ phase, startupPoster }, setFirstFrame] = useState<FirstFrame>({
    phase: 'waiting',
    startupPoster: false,
  });
  const rendered = phase === 'fade' || phase === 'ready';
  const pending = active && !rendered;
  if (!rendered && ((!pending && phase === 'loading') || (paused && !startupPoster))) {
    setFirstFrame({ phase: 'waiting', startupPoster: startupPoster || paused });
  }

  const onRendered = useCallback((ready: boolean) => {
    setFirstFrame((current) => {
      if (!ready) return { ...current, phase: 'waiting' };
      const fade = current.phase === 'waiting' && !current.startupPoster;
      return { phase: fade ? 'fade' : 'ready', startupPoster: false };
    });
  }, []);

  useEffect(() => {
    if (!pending) return;
    const loading = window.setTimeout(() => {
      setFirstFrame((current) =>
        current.phase === 'waiting' ? { ...current, phase: 'loading' } : current,
      );
    }, loadingDelayMs);
    const deadline = window.setTimeout(onUnavailable, firstFrameDeadlineMs);
    return () => {
      window.clearTimeout(loading);
      window.clearTimeout(deadline);
    };
  }, [onUnavailable, pending]);

  const reveal: GlassReveal = phase === 'loading' ? 'waiting' : phase;
  return { rendered, startupPoster, loading: pending && phase === 'loading', reveal, onRendered };
}

export function useGlassField(paused: boolean, viewportReady: boolean, deferStartup = false) {
  const artwork = useRef<HTMLDivElement>(null);
  const inView = useInView(artwork);
  const visible = usePageVisible();
  const { reduce } = useMotionPreference();
  const motionReady = useMotionStart(deferStartup);
  const [interested, setInterested] = useState(false);
  const [Field, setField] = useState<FieldComponent | null>(null);
  const [failed, setFailed] = useState(false);
  const onUnavailable = useCallback(() => setFailed(true), []);
  const enabled = visible && !reduce && !failed;
  const active = enabled && inView && !paused && viewportReady && (motionReady || interested);
  const { rendered, startupPoster, loading, reveal, onRendered } = useFirstFrame(
    active,
    paused,
    onUnavailable,
  );
  const available = enabled && (inView || rendered) && (!paused || rendered);
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
    const prepared = prepareField().catch(() => {
      if (current) onUnavailable();
    });
    // Load the code while waiting for paint. GPU setup starts only on mount.
    const cancel = afterFirstPaint(() => {
      void prepared.then((module) => {
        if (current && module) setField(() => module.default);
      });
    });
    return () => {
      current = false;
      cancel();
    };
  }, [active, onUnavailable]);

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
    loading,
    reveal,
    onRendered,
    onUnavailable,
    prepare,
  };
}
