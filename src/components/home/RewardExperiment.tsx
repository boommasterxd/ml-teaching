'use client';

import { useId, useRef, useState } from 'react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import {
  motionTokens,
  useShouldReduceMotion,
  useTempoTransition,
} from '@animate-ui/react/utils/motion';
import { Button } from '../ui/button';
import { Text } from '../ui/typography';

type Goal = 'star' | 'treasure';
const routes = {
  star: { name: 'Stern', path: 'M40 244V176H108V108H176V40H312', steps: 7 },
  treasure: { name: 'Schatz', path: 'M40 244H108V176H312V244', steps: 6 },
} as const;
const cells = Array.from({ length: 20 }, (_, index) => ({
  x: 12 + (index % 5) * 68,
  y: 12 + Math.floor(index / 5) * 68,
}));
const barriers = [5, 8, 18];

function RewardPath({ goal }: { goal: Goal }) {
  const reduce = useShouldReduceMotion();
  const path = routes[goal].path;
  const transition = useTempoTransition({
    duration: reduce ? 0 : 1.4,
    ease: motionTokens.ease.draw,
  });

  return (
    <g>
      <Effect
        asChild
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={transition}
      >
        <path d={path} className="reward-experiment-route" />
      </Effect>
      {reduce ? (
        <circle
          cx="312"
          cy={goal === 'star' ? 40 : 244}
          r="9"
          className="reward-experiment-agent"
        />
      ) : (
        <Effect
          asChild
          initial={{ pathLength: 0.001, pathOffset: 0 }}
          animate={{ pathLength: 0.001, pathOffset: 0.999 }}
          transition={transition}
        >
          <path d={path} className="reward-experiment-traveler" />
        </Effect>
      )}
    </g>
  );
}

function RewardBoard({ goal, sequence }: { goal: Goal | null; sequence: number }) {
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
      <desc id={descriptionId}>
        {goal
          ? `Beispielweg zum ${routes[goal].name}: ${routes[goal].steps} Schritte um die Hindernisse.`
          : 'Der Agent startet links unten. Der Stern liegt rechts oben, der Schatz rechts unten.'}
      </desc>
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
      <g className="reward-experiment-goal" data-rewarded={goal === 'star'}>
        <path d="m312 23 5 11 12 2-9 8 2 12-10-6-10 6 2-12-9-8 12-2Z" />
      </g>
      <g className="reward-experiment-goal" data-rewarded={goal === 'treasure'}>
        <rect x="296" y="234" width="32" height="23" rx="4" />
        <path d="M296 243h32m-26-9v-5h20v5m-10 5v9" />
      </g>
      <circle cx="40" cy="244" r="15" className="reward-experiment-start" />
      {!goal && <circle cx="40" cy="244" r="6" className="reward-experiment-agent" />}
      {goal && <RewardPath key={sequence} goal={goal} />}
    </svg>
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
      <RewardBoard goal={goal} sequence={sequence} />
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
