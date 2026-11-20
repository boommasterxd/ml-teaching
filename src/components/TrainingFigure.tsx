import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { spring, useTempoTransition } from '@animate-ui/react/utils/motion';
import { motion } from 'motion/react';
import { memo } from 'react';
import { Brain } from './icons/brain';
import { Check } from './icons/check';
import { useMotionPreference } from './ui/use-motion-preference';

const examplePositions = [10, 28, 46];
const featurePaths = ['M21 10 C46 10 39 28 63 28', 'M21 28 H63', 'M21 46 C46 46 39 28 63 28'];

/** The examples converge on the classifier, as in the lesson's KNN illustration. */
const TrainingFigure = memo(function TrainingFigure({
  state,
  progress,
}: {
  state: 'idle' | 'training' | 'complete';
  progress: number;
}) {
  const { reduce } = useMotionPreference();
  const draw = useTempoTransition(spring.progress);
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
              <motion.path
                d={path}
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                initial={false}
                animate={{ pathLength: complete ? 1 : progress }}
                transition={reduce ? { duration: 0 } : draw}
              />
            )}
          </g>
        ))}
      </svg>
      {complete ? (
        <Effect
          fade={!reduce}
          zoom={reduce ? false : { initialScale: 0.8 }}
          className="absolute top-1/2 right-0 grid size-[35%] aspect-square h-auto -translate-y-1/2 place-items-center rounded-full border border-success-border bg-success-soft text-success"
        >
          <Check className="size-7 sm:size-9" animate={!reduce} />
        </Effect>
      ) : (
        <span className="absolute top-1/2 right-0 grid size-[35%] aspect-square h-auto -translate-y-1/2 place-items-center rounded-full border border-primary/25 bg-card">
          <Brain className="size-7 sm:size-9" />
        </span>
      )}
    </div>
  );
});

export default TrainingFigure;
