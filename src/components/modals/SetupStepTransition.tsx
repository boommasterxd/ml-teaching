'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, MotionConfig, motion, useIsPresent } from 'motion/react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { ReducedMotionContext } from '@animate-ui/react/utils/motion';
import { flowMotion } from '../animate-ui/components/flow-motion';
import { useMotionPreference } from '../ui/use-motion-preference';
import { cn } from '@/lib/utils';

export type SetupStep = 'consent' | 'loading' | 'camera' | 'error' | 'workspace';

// AutoHeight starts at zero with inline overflow. The initial static consent needs natural height.
function useStepHeight(step: SetupStep, reduce: boolean) {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const previousStep = useRef(step);
  const previousHeight = useRef<number>(0);
  const animation = useRef<Animation | undefined>(undefined);
  const changed = useRef(false);

  useLayoutEffect(() => {
    const frame = viewport.current!;
    const panel = content.current!;
    if (previousStep.current !== step) {
      changed.current = true;
      previousStep.current = step;
      const titleId = frame.closest('[role="dialog"]')?.getAttribute('aria-labelledby');
      if (titleId) document.getElementById(titleId)?.focus();
    }
    function measure() {
      const target = panel.getBoundingClientRect().height;
      const previous = previousHeight.current;
      previousHeight.current = target;
      if (reduce) animation.current?.cancel();
      if (!changed.current || reduce || !previous || previous === target) return;
      const from = animation.current?.playState === 'running' ? frame.offsetHeight : previous;
      animation.current?.cancel();
      animation.current = frame.animate([{ height: `${from}px` }, { height: `${target}px` }], {
        duration: flowMotion.enter.duration * 1000,
        easing: `cubic-bezier(${flowMotion.enter.ease.join(',')})`,
      });
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [step, reduce]);

  useLayoutEffect(() => () => animation.current?.cancel(), []);
  return { viewport, content };
}

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
}: {
  step: SetupStep;
  children: ReactNode;
}) {
  const [initialStep] = useState(step);
  const motionPreference = useMotionPreference();
  const { viewport, content } = useStepHeight(step, motionPreference.reduce);
  return (
    // Expand the clip edge around focus outlines without moving the step controls.
    <div
      ref={viewport}
      className="-m-(--step-focus-space) min-w-0 overflow-clip [--step-focus-space:8px]"
    >
      <div ref={content} className="p-(--step-focus-space)">
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
    </div>
  );
}
