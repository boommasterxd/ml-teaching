'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { usePageVisible } from '@animate-ui/react/utils/use-page-visible';
import { deferDecorativeMotion } from '@/lib/experimental-motion';
import { useMotionStart } from '../ui/use-motion-start';
import { useMotionPreference } from '../ui/use-motion-preference';

type FieldComponent = typeof import('./TopographyField').default;

let fieldModule: Promise<typeof import('./TopographyField')> | undefined;

function prepareField() {
  fieldModule ??= import('./TopographyField').catch((error: unknown) => {
    fieldModule = undefined;
    throw error;
  });
  return fieldModule;
}

function afterFirstPaint(prepare: () => void, waitForDocumentLoad: boolean) {
  let frame = 0;
  const schedule = () => {
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(prepare);
    });
  };
  if (!waitForDocumentLoad || document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
  return () => {
    window.removeEventListener('load', schedule);
    cancelAnimationFrame(frame);
  };
}

export function useGlassField(
  paused: boolean,
  viewportReady: boolean,
  waitForDocumentLoad = false,
) {
  const artwork = useRef<HTMLDivElement>(null);
  const inView = useInView(artwork);
  const visible = usePageVisible();
  const { reduce } = useMotionPreference();
  const motionReady = useMotionStart();
  const [interested, setInterested] = useState(false);
  const [Field, setField] = useState<FieldComponent | null>(null);
  const [failed, setFailed] = useState(false);
  const [rendered, onRendered] = useState(false);
  const onUnavailable = useCallback(() => setFailed(true), []);
  const available = visible && !reduce && !failed && (inView || rendered);
  const active = inView && available && !paused && viewportReady && (motionReady || interested);

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
    }, waitForDocumentLoad && !deferDecorativeMotion);
    return () => {
      current = false;
      cancel();
    };
  }, [active, waitForDocumentLoad]);

  const prepare = () => {
    if (reduce || failed) return;
    if (deferDecorativeMotion) setInterested(true);
    void prepareField().catch(() => {});
  };
  return {
    artwork,
    Field,
    available,
    inView,
    failed,
    reduce,
    rendered,
    pending: active && !rendered,
    onRendered,
    onUnavailable,
    prepare,
  };
}
