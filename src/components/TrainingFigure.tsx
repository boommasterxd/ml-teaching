import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import { memo } from 'react';
import { Brain } from './icons/brain';
import { Check } from './icons/check';

const examplePositions = [10, 28, 46];
const featurePaths = ['M21 10 C46 10 39 28 63 28', 'M21 28 H63', 'M21 46 C46 46 39 28 63 28'];

/** The examples converge on the classifier, as in the lesson's KNN illustration. */
const TrainingFigure = memo(function TrainingFigure({
  state,
}: {
  state: 'idle' | 'training' | 'complete';
}) {
  const reduce = useShouldReduceMotion();
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
        {featurePaths.map((path, index) => (
          <g key={path}>
            <path d={path} className="stroke-primary/25" />
            {state !== 'idle' && (
              <Effect
                asChild
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7, delay: index * 0.15, ease: 'easeOut' }}
              >
                <path d={path} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </Effect>
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
          <Brain className="size-7 sm:size-9" animate={state === 'training' && !reduce} />
        </span>
      )}
    </div>
  );
});

export default TrainingFigure;
