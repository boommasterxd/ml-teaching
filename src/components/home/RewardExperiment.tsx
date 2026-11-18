'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import {
  motionTokens,
  useShouldReduceMotion,
  useTempoTransition,
} from '@animate-ui/react/utils/motion';
import { AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { Text } from '../ui/typography';
import { usePreviewCycle } from './PreviewCycle';
import { PreviewHighlight } from './PreviewHighlight';

type Goal = 'star' | 'treasure';
const routes = {
  star: { name: 'Stern', path: 'M40 244V176H108V108H176V40H312', steps: 7 },
  treasure: { name: 'Schatz', path: 'M40 244H108V176H312V244', steps: 6 },
} as const;
const previewDescription = `Der Agent startet links unten. Er nimmt ${routes.star.steps} Schritte zum Stern rechts oben oder ${routes.treasure.steps} Schritte zum Schatz rechts unten und weicht den Hindernissen aus.`;
const cells = Array.from({ length: 20 }, (_, index) => ({
  x: 12 + (index % 5) * 68,
  y: 12 + Math.floor(index / 5) * 68,
}));
const barriers = [5, 8, 18];

function RewardPathAnimation({ path }: { path: string }) {
  const transition = useTempoTransition({
    duration: 1.4,
    ease: motionTokens.ease.draw,
  });

  return (
    <g>
      <Effect
        asChild
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={transition}
      >
        <path d={path} className="reward-experiment-route" />
      </Effect>
      <Effect
        asChild
        initial={{ pathLength: 0.001, pathOffset: 0 }}
        animate={{ pathLength: 0.001, pathOffset: 0.999 }}
        transition={transition}
      >
        <path d={path} className="reward-experiment-traveler" />
      </Effect>
    </g>
  );
}

function RewardPath({ goal }: { goal: Goal }) {
  const reduce = useShouldReduceMotion();
  const path = routes[goal].path;

  if (!reduce) return <RewardPathAnimation path={path} />;

  return (
    <g>
      <path d={path} className="reward-experiment-route" />
      <circle cx="312" cy={goal === 'star' ? 40 : 244} r="9" className="reward-experiment-agent" />
    </g>
  );
}

function RewardGoalMarker({ goal, highlighted }: { goal: Goal; highlighted: boolean }) {
  return (
    <g className="reward-experiment-goal" data-rewarded={highlighted}>
      {goal === 'star' ? (
        <path d="m312 23 5 11 12 2-9 8 2 12-10-6-10 6 2-12-9-8 12-2Z" />
      ) : (
        <>
          <rect x="296" y="234" width="32" height="23" rx="4" />
          <path d="M296 243h32m-26-9v-5h20v5m-10 5v9" />
        </>
      )}
    </g>
  );
}

function describeGoal(goal: Goal | null) {
  return goal
    ? `Beispielweg zum ${routes[goal].name}: ${routes[goal].steps} Schritte um die Hindernisse.`
    : 'Der Agent startet links unten. Der Stern liegt rechts oben, der Schatz rechts unten.';
}

function RewardBoard({
  highlightedGoal = null,
  showAgentAtStart = !highlightedGoal,
  description = describeGoal(highlightedGoal),
  children,
}: {
  highlightedGoal?: Goal | null;
  showAgentAtStart?: boolean;
  description?: string;
  children?: ReactNode;
}) {
  const titleId = useId();
  const descriptionId = useId();
  return (
    <svg
      className="reward-experiment-board"
      viewBox="0 0 352 284"
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>Ein Agent, zwei mögliche Ziele</title>
      <desc id={descriptionId}>{description}</desc>
      {cells.map(({ x, y }, index) => (
        <rect
          key={index}
          x={x}
          y={y}
          width="56"
          height="56"
          rx="10"
          className={barriers.includes(index) ? 'reward-experiment-wall' : 'reward-experiment-cell'}
        />
      ))}
      <RewardGoalMarker goal="star" highlighted={highlightedGoal === 'star'} />
      <RewardGoalMarker goal="treasure" highlighted={highlightedGoal === 'treasure'} />
      <circle cx="40" cy="244" r="15" className="reward-experiment-start" />
      {showAgentAtStart && <circle cx="40" cy="244" r="6" className="reward-experiment-agent" />}
      {children}
    </svg>
  );
}

export function RewardPreview() {
  const { rewardRef, rewardGoal, rewardSequence, animateReward, showRewardMotion } =
    usePreviewCycle();
  const [interruptedSequence, setInterruptedSequence] = useState<number | null>(null);

  // Do not replay the same turn after the preview has become inactive.
  if (rewardGoal && !animateReward && interruptedSequence !== rewardSequence) {
    setInterruptedSequence(rewardSequence);
  }
  const activeGoal = animateReward && interruptedSequence !== rewardSequence ? rewardGoal : null;

  return (
    <div className="reward-experiment" ref={rewardRef}>
      <RewardBoard showAgentAtStart={!activeGoal} description={previewDescription}>
        {showRewardMotion && (
          <AnimatePresence initial={false}>
            {activeGoal && (
              <PreviewHighlight key={rewardSequence} aria-hidden="true">
                <RewardGoalMarker goal={activeGoal} highlighted />
                <RewardPath goal={activeGoal} />
              </PreviewHighlight>
            )}
          </AnimatePresence>
        )}
      </RewardBoard>
    </div>
  );
}

export default function RewardExperiment() {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [sequence, setSequence] = useState(0);
  const firstAction = useRef<HTMLButtonElement>(null);
  const tryGoal = (next: Goal) => {
    setGoal(next);
    setSequence((value) => value + 1);
  };

  return (
    <div className="reward-experiment">
      <div className="reward-experiment-controls mobile-action-pair">
        <Button ref={firstAction} variant="outline" onClick={() => tryGoal('star')}>
          Stern belohnen
        </Button>
        <Button variant="outline" onClick={() => tryGoal('treasure')}>
          Schatz belohnen
        </Button>
        <Button
          className="reward-experiment-reset"
          variant="ghost"
          disabled={!goal}
          onClick={() => {
            setGoal(null);
            firstAction.current?.focus();
          }}
        >
          Zurücksetzen
        </Button>
      </div>
      <RewardBoard highlightedGoal={goal}>
        {goal && <RewardPath key={sequence} goal={goal} />}
      </RewardBoard>
      <div
        className="reward-experiment-readout"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <Text variant="small">
          {goal
            ? `${routes[goal].name}: +10 Belohnung · ${routes[goal].steps} Schritte`
            : 'Noch kein Ziel belohnt'}
        </Text>
      </div>
    </div>
  );
}
