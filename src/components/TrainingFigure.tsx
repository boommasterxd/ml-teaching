import { Effect } from '@animate-ui/react/primitives/effects/effect';
import {
  motionTokens,
  ReducedMotionContext,
  useTempoTransition,
} from '@animate-ui/react/utils/motion';
import { AnimatePresence, MotionConfig, useIsPresent, type Transition } from 'motion/react';
import { memo } from 'react';
import { CircleCheckBig } from './icons/animated-circle-check-big';
import { Brain } from './icons/brain';
import { useMotionPreference } from './ui/use-motion-preference';

const examplePositions = [10, 28, 46];
const featurePaths = ['M21 10 C46 10 39 28 63 28', 'M21 28 H63', 'M21 46 C46 46 39 28 63 28'];
const instant = { duration: 0 };

function ClassifierNode({ complete }: { complete: boolean }) {
  const { preference, reduce } = useMotionPreference();
  const present = useIsPresent();
  const fade = useTempoTransition(motionTokens.transition.fade);

  return (
    // Retarget the fade on preference changes without remounting the success icon.
    <ReducedMotionContext value="never">
      <Effect
        fade
        hidden={reduce && !present}
        initial={reduce ? false : 'hidden'}
        animate={reduce ? { opacity: 1, transition: instant } : 'visible'}
        transition={reduce ? instant : fade}
        className="absolute top-1/2 right-0 grid aspect-square w-[35%] -translate-y-1/2"
      >
        <ReducedMotionContext value={preference}>
          <MotionConfig reducedMotion={preference}>
            {complete ? (
              <CircleCheckBig animation="draw-in" className="size-full text-success" />
            ) : (
              <span className="grid size-full place-items-center rounded-full border border-primary/25 bg-card">
                <Brain className="size-7 sm:size-9" />
              </span>
            )}
          </MotionConfig>
        </ReducedMotionContext>
      </Effect>
    </ReducedMotionContext>
  );
}

/** The examples converge on the classifier, as in the lesson's KNN illustration. */
const TrainingFigure = memo(function TrainingFigure({
  state,
  progress,
  transition,
}: {
  state: 'idle' | 'training' | 'complete';
  progress: number;
  transition: Transition;
}) {
  const { reduce } = useMotionPreference();
  const draw = useTempoTransition(transition);
  const complete = state === 'complete';
  return (
    <div className="relative aspect-[104/56] w-44 shrink-0 text-primary sm:w-60" aria-hidden="true">
      <svg viewBox="0 0 104 56" className="size-full" fill="none">
        {examplePositions.map((y) => (
          <rect
            key={y}
            x="5"
            y={y - 5}
            width="10"
            height="10"
            rx="3"
            className="fill-primary/15 stroke-primary/55"
          />
        ))}
        {featurePaths.map((path) => (
          <g key={path}>
            <path d={path} className="stroke-primary/25" />
            {state !== 'idle' && (
              <Effect
                asChild
                initial={false}
                animate={{ pathLength: complete ? 1 : progress }}
                transition={reduce ? instant : draw}
              >
                <path d={path} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </Effect>
            )}
          </g>
        ))}
      </svg>
      <AnimatePresence initial={false}>
        <ClassifierNode key={complete ? 'complete' : 'brain'} complete={complete} />
      </AnimatePresence>
    </div>
  );
});

export default TrainingFigure;
