'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { usePageVisible } from '@animate-ui/react/utils/use-page-visible';
import { useMotionPreference } from '../ui/use-motion-preference';

type FieldComponent = typeof import('./TopographyField').default;
type RenderState = 'pending' | 'rendered' | 'released';

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
  {
    waitForDocumentLoad = true,
    retainOffscreen = false,
  }: { waitForDocumentLoad?: boolean; retainOffscreen?: boolean } = {},
) {
  const artwork = useRef<HTMLDivElement>(null);
  const inView = useInView(artwork, { amount: retainOffscreen ? 'some' : 0.05 });
  const visible = usePageVisible();
  const { reduce } = useMotionPreference();
  const [Field, setField] = useState<FieldComponent | null>(null);
  const [failed, setFailed] = useState(false);
  const [renderState, setRenderState] = useState<RenderState>('pending');
  const onUnavailable = useCallback(() => setFailed(true), []);
  const onRendered = useCallback((ready: boolean) => {
    setRenderState((state) => {
      if (ready) return 'rendered';
      return state === 'rendered' ? 'released' : state;
    });
  }, []);
  const rendered = renderState === 'rendered';
  const available = visible && !reduce && !failed && (inView || (retainOffscreen && rendered));
  const active = inView && available && !paused && viewportReady;

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
    }, waitForDocumentLoad);
    return () => {
      current = false;
      cancel();
    };
  }, [active, waitForDocumentLoad]);

  const prepare = () => {
    if (!reduce && !failed) void prepareField().catch(() => {});
  };
  return {
    artwork,
    Field,
    available,
    inView,
    failed,
    reduce,
    rendered,
    hasRendered: renderState !== 'pending',
    onRendered,
    onUnavailable,
    prepare,
  };
}
