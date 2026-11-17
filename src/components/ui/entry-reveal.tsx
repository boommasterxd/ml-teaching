'use client';

import { useCallback, useRef, useState, type ReactElement } from 'react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { MotionConfig } from 'motion/react';
import {
  motionTokens,
  ReducedMotionContext,
  useReducedMotionSetting,
  useShouldReduceMotion,
} from '@animate-ui/react/utils/motion';
import { useEntryViewportReady, useInitialEntry } from './entry-policy';
import { EntryTarget } from './entry-target';

type EntryKind = 'hero' | 'text' | 'surface' | 'reading' | 'navigation' | 'shell';
type Admission = 'static' | 'load' | 'scroll';
const distances: Record<EntryKind, number> = {
  hero: 0,
  text: 10,
  surface: 16,
  reading: 6,
  navigation: 8,
  shell: 6,
};

interface EntryRevealProps {
  children: ReactElement;
  kind?: EntryKind;
  index?: number;
  className?: string;
  asChild?: boolean;
  active?: boolean;
  activation?: boolean;
}

function loadTarget(kind: EntryKind, offset: number, complete: boolean) {
  if (kind === 'hero') return { filter: complete ? 'blur(0px)' : [null, 'blur(0px)'] };
  if (complete) return undefined;
  return kind === 'navigation' ? { x: [offset, 0] } : { y: [offset, 0] };
}

/** SSG stays visible. First-screen entry never fades text; offscreen groups reveal only once. */
export function EntryReveal({
  children,
  kind = 'surface',
  index = 0,
  className,
  asChild = false,
  active = true,
  activation = false,
}: EntryRevealProps) {
  const initialEntry = useInitialEntry();
  const viewportReady = useEntryViewportReady();
  const reduce = useShouldReduceMotion();
  const preference = useReducedMotionSetting();
  const configured = useRef(false);
  const [admission, setAdmission] = useState<Admission>('static');
  const [focused, setFocused] = useState(false);
  const [loadComplete, setLoadComplete] = useState(false);
  const attach = useCallback(
    (element: HTMLElement | null) => {
      if (!element || !active || !viewportReady || configured.current) return;
      configured.current = true;
      const rect = element.getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < window.innerHeight;
      setAdmission(visible ? (initialEntry || activation ? 'load' : 'static') : 'scroll');
    },
    [active, initialEntry, activation, viewportReady],
  );
  const moving = !reduce && !focused;
  const scroll = admission === 'scroll' && moving;
  const offset = distances[kind] * (kind === 'navigation' ? -1 : 1);
  const delay = moving ? Math.min(2, Math.max(0, index)) * 0.08 : 0;
  const animate = !moving
    ? { x: 0, y: 0, opacity: 1, filter: 'blur(0px)', transition: { duration: 0 } }
    : admission === 'load'
      ? loadTarget(kind, offset, loadComplete)
      : undefined;

  return (
    <ReducedMotionContext value="never">
      <MotionConfig reducedMotion="never">
        <Effect
          ref={attach}
          asChild
          className={className}
          data-entry-reveal={kind}
          data-entry-initial={initialEntry && active}
          data-scroll-reveal=""
          data-entry-admission={admission}
          initial={false}
          inView={scroll}
          inViewOnce
          inViewMargin="-24px"
          fade={scroll && kind !== 'reading'}
          slide={
            scroll
              ? { direction: kind === 'navigation' ? 'right' : 'up', offset: Math.abs(offset) }
              : false
          }
          blur={scroll && (kind === 'surface' || kind === 'hero') ? { initialBlur: 2 } : false}
          {...(animate ? { animate } : {})}
          transition={{ ...motionTokens.transition.reveal, delay }}
          onFocusCapture={() => setFocused(true)}
          onAnimationComplete={(definition) => {
            if (admission === 'load' && !loadComplete && typeof definition !== 'string')
              setLoadComplete(true);
          }}
        >
          <EntryTarget asChild={asChild} preference={preference}>
            {children}
          </EntryTarget>
        </Effect>
      </MotionConfig>
    </ReducedMotionContext>
  );
}
