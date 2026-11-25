'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, MotionConfig, motion, useIsPresent } from 'motion/react';
import { AutoHeight } from '@animate-ui/react/primitives/effects/auto-height';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { ReducedMotionContext } from '@animate-ui/react/utils/motion';
import { flowMotion } from '../animate-ui/components/flow-motion';
import { useControlHydrated } from '../ui/use-control-hydration';
import { useMotionPreference } from '../ui/use-motion-preference';
import { cn } from '@/lib/utils';

export type SetupStep = 'consent' | 'loading' | 'camera' | 'error' | 'workspace';

function StepPanel({
  step,
  initial,
  motionPreference,
  children,
}: {
  step: SetupStep;
  initial: boolean;
  motionPreference: ReturnType<typeof useMotionPreference>;
  children: ReactNode;
}) {
  const present = useIsPresent();
  const { preference, reduce } = motionPreference;
  const props = {
    className: cn(
      // Size the panel independently of the frame that animates to its height.
      'flex max-h-[calc(var(--dialog-height)-2*var(--dialog-block-padding)-2px)] min-w-0 flex-col gap-[min(var(--dialog-step-gap),4dvh)] sm:[--dialog-step-gap:1.5rem]',
      step === 'consent' ? '[--dialog-step-gap:0.75rem]' : '[--dialog-step-gap:1.25rem]',
      !present && 'pointer-events-none absolute inset-x-0 top-0',
    ),
    inert: !present,
    'aria-hidden': !present || undefined,
    exit: {
      x: reduce ? 0 : flowMotion.exitOffset,
      opacity: 0,
      transition: reduce ? { duration: 0 } : flowMotion.exit,
    },
  };
  // The SSG panel has only an exit target, so its initial HTML needs no inline style.
  if (initial) return <motion.div {...props}>{children}</motion.div>;
  return (
    // Effect remounts on preference changes. Apply reduction to its targets and keep controls mounted.
    <ReducedMotionContext value="never">
      <MotionConfig reducedMotion="never">
        <Effect
          fade
          slide={{ direction: 'left', offset: flowMotion.enterOffset }}
          initial={reduce ? false : 'hidden'}
          {...(reduce ? { animate: { x: 0, opacity: 1, transition: { duration: 0 } } } : {})}
          transition={flowMotion.enter}
          {...props}
        >
          <ReducedMotionContext value={preference}>
            <MotionConfig reducedMotion={preference}>{children}</MotionConfig>
          </ReducedMotionContext>
        </Effect>
      </MotionConfig>
    </ReducedMotionContext>
  );
}

export default function SetupStepTransition({
  step,
  children,
  animateHeight = true,
}: {
  step: SetupStep;
  children: ReactNode;
  animateHeight?: boolean;
}) {
  const [initialStep] = useState(step);
  const previousStep = useRef(step);
  const viewport = useRef<HTMLDivElement>(null);
  const hydrated = useControlHydrated();
  const motionPreference = useMotionPreference();
  const heightOverride = hydrated ? { height: 'auto' } : { height: undefined };

  useLayoutEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    const titleId = viewport.current?.closest('[role="dialog"]')?.getAttribute('aria-labelledby');
    if (titleId) document.getElementById(titleId)?.focus();
  }, [step]);

  return (
    // A parent that suppresses entry seeds the initial style from AutoHeight's animate target.
    <AutoHeight
      ref={viewport}
      initial={{}}
      style={{ overflow: undefined }}
      animate={hydrated && animateHeight && !motionPreference.reduce ? undefined : heightOverride}
      transition={animateHeight ? flowMotion.enter : { duration: 0 }}
      className="-m-(--step-focus-space) min-w-0 overflow-clip [--step-focus-space:8px]"
    >
      <div className="p-(--step-focus-space)">
        <div className="relative">
          <AnimatePresence initial={false}>
            <StepPanel
              key={step}
              step={step}
              initial={step === initialStep}
              motionPreference={motionPreference}
            >
              {children}
            </StepPanel>
          </AnimatePresence>
        </div>
      </div>
    </AutoHeight>
  );
}
