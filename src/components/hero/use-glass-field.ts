'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import { usePageVisible } from '@animate-ui/react/utils/use-page-visible';

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

function afterFirstPaint(prepare: () => void) {
  let frame = 0;
  const schedule = () => {
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(prepare);
    });
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
  return () => {
    window.removeEventListener('load', schedule);
    cancelAnimationFrame(frame);
  };
}

export function useGlassField(paused: boolean, viewportReady: boolean) {
  const artwork = useRef<HTMLDivElement>(null);
  const inView = useInView(artwork, { amount: 0.05 });
  const visible = usePageVisible();
  const reduce = useShouldReduceMotion();
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
  const available = inView && visible && !reduce && !failed;
  const active = available && !paused && viewportReady;

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

  const prepare = () => {
    if (!reduce && !failed) void prepareField().catch(() => {});
  };
  return {
    artwork,
    Field,
    available,
    failed,
    reduce,
    rendered: renderState === 'rendered',
    hasRendered: renderState !== 'pending',
    onRendered,
    onUnavailable,
    prepare,
  };
}
