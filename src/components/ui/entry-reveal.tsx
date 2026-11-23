'use client';

import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { cancelFrame, frame, MotionConfig } from 'motion/react';
import { motionTokens, ReducedMotionContext } from '@animate-ui/react/utils/motion';
import { useEntryViewportReady } from './entry-policy';
import { EntryTarget } from './entry-target';
import { useMotionPreference } from './use-motion-preference';

type EntryKind = 'text' | 'surface' | 'reading' | 'navigation' | 'shell';
type Admission = 'static' | 'activation' | 'scroll';
const distances: Record<EntryKind, number> = {
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

function activationTarget(kind: EntryKind, offset: number) {
  return kind === 'navigation' ? { x: [offset, 0] } : { y: [offset, 0] };
}

/** Keep visible initial content stationary; reveal offscreen groups or new user-activated content. */
export function EntryReveal({
  children,
  kind = 'surface',
  index = 0,
  className,
  asChild = false,
  active = true,
  activation = false,
}: EntryRevealProps) {
  const viewportReady = useEntryViewportReady();
  const { preference, reduce } = useMotionPreference();
  const target = useRef<HTMLElement>(null);
  const attach = useCallback((element: HTMLElement | null) => {
    target.current = element;
  }, []);
  const configured = useRef(false);
  const [admission, setAdmission] = useState<Admission>('static');
  const [focused, setFocused] = useState(false);
  const [activationComplete, setActivationComplete] = useState(false);
  useEffect(() => {
    const element = target.current;
    if (!element || !active || !viewportReady || configured.current) return;
    const read = () => {
      configured.current = true;
      const rect = element.getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < window.innerHeight;
      if (visible && activation) setAdmission('activation');
      else if (!visible && rect.bottom >= 0) setAdmission('scroll');
    };
    // Group geometry reads outside the hydration commit and before Motion writes.
    frame.read(read);
    return () => cancelFrame(read);
  }, [active, activation, viewportReady]);
  const moving = !reduce && !focused;
  const scroll = admission === 'scroll' && moving;
  const offset = distances[kind] * (kind === 'navigation' ? -1 : 1);
  const delay = moving ? Math.min(2, Math.max(0, index)) * (scroll ? 0.05 : 0.08) : 0;
  const scrollOffset = Math.max(14, Math.abs(offset));
  const animate = !moving
    ? { x: 0, y: 0, opacity: 1, transition: { duration: 0 } }
    : admission === 'activation' && !activationComplete
      ? activationTarget(kind, offset)
      : undefined;

  return (
    <ReducedMotionContext value="never">
      <MotionConfig reducedMotion="never">
        <Effect
          ref={attach}
          asChild
          className={className}
          data-entry-reveal={kind}
          data-scroll-reveal=""
          data-entry-admission={admission}
          initial={false}
          inView={scroll}
          inViewOnce
          inViewMargin="0px 0px -12px"
          fade={scroll && (kind === 'surface' || kind === 'navigation')}
          slide={
            scroll
              ? { direction: kind === 'navigation' ? 'right' : 'up', offset: scrollOffset }
              : false
          }
          {...(animate ? { animate } : {})}
          transition={{ ...motionTokens.transition.reveal, delay }}
          onFocusCapture={() => setFocused(true)}
          onAnimationComplete={(definition) => {
            if (admission === 'activation' && !activationComplete && typeof definition !== 'string')
              setActivationComplete(true);
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
