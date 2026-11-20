'use client';

import { useRef, useState } from 'react';
import { usePageVisible } from '@animate-ui/react/utils/use-page-visible';
import { useInView } from 'motion/react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { RewardBoard, routes, type Goal } from './RewardBoard';
import RewardPath from './RewardPath';

export default function RewardExperiment() {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [sequence, setSequence] = useState(0);
  const board = useRef<HTMLDivElement>(null);
  const inView = useInView(board, { amount: 0.2 });
  const pageVisible = usePageVisible();
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
      <div ref={board} className="reward-experiment-stage">
        <RewardBoard highlightedGoal={goal}>
          {goal && <RewardPath key={sequence} goal={goal} playing={inView && pageVisible} />}
        </RewardBoard>
      </div>
      <Alert role="status" aria-atomic="true">
        <AlertDescription>
          {goal
            ? `${routes[goal].name}: +10 Belohnung · ${routes[goal].steps} Schritte`
            : 'Noch kein Ziel belohnt'}
        </AlertDescription>
      </Alert>
    </div>
  );
}
