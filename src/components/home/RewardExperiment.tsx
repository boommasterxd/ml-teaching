'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { usePageVisible } from '@animate-ui/react/utils/use-page-visible';
import {
  motionTokens,
  useShouldReduceMotion,
  useTempoTransition,
} from '@animate-ui/react/utils/motion';
import { animate, AnimatePresence, useInView, type AnimationPlaybackControls } from 'motion/react';
import { Check } from '../icons/check';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { usePreviewCycle } from './PreviewCycle';
import { PreviewHighlight } from './PreviewHighlight';

type Goal = 'star' | 'treasure';
const routes = {
  star: {
    name: 'Stern',
    cell: 4,
    path: 'M40 244V188Q40 176 52 176H96Q108 176 108 164V120Q108 108 120 108H164Q176 108 176 96V52Q176 40 188 40H312',
    steps: 7,
  },
  treasure: {
    name: 'Schatz',
    cell: 19,
    path: 'M40 244H96Q108 244 108 232V188Q108 176 120 176H300Q312 176 312 188V244',
    steps: 6,
  },
} as const;
const previewDescription = `Der Agent startet links unten. Er nimmt ${routes.star.steps} Schritte zum Stern rechts oben oder ${routes.treasure.steps} Schritte zum Schatz rechts unten und weicht den Hindernissen aus.`;
const cells = Array.from({ length: 20 }, (_, index) => ({
  x: 12 + (index % 5) * 68,
  y: 12 + Math.floor(index / 5) * 68,
}));
const barriers = [5, 8, 18];
const cellSize = 56;
const cellRadius = 12;

function RewardPath({
  goal,
  playing = true,
  onArrival,
}: {
  goal: Goal;
  playing?: boolean;
  onArrival?: () => void;
}) {
  const reduce = useShouldReduceMotion();
  const route = useRef<SVGPathElement>(null);
  const traveler = useRef<SVGCircleElement>(null);
  const playback = useRef<AnimationPlaybackControls | null>(null);
  const { duration, ease } = useTempoTransition({ duration: 1.9, ease: motionTokens.ease.draw });
  const endY = goal === 'star' ? 40 : 244;

  useEffect(() => {
    const path = route.current;
    const agent = traveler.current;
    if (!path || !agent || reduce || !path.getTotalLength) return;
    const length = path.getTotalLength();
    const draw = (progress: number) => {
      const point = path.getPointAtLength(progress * length);
      agent.setAttribute('cx', String(point.x));
      agent.setAttribute('cy', String(point.y));
      path.setAttribute('stroke-dashoffset', String(1 - progress));
    };
    draw(0);
    const controls = animate(0, 1, {
      duration,
      ease,
      onUpdate: draw,
      onComplete: () => {
        playback.current = null;
        onArrival?.();
      },
    });
    playback.current = controls;
    return () => {
      controls.stop();
      playback.current = null;
    };
  }, [duration, ease, goal, onArrival, reduce]);

  useEffect(() => {
    if (playing) playback.current?.play();
    else playback.current?.pause();
  }, [playing, goal, reduce]);

  return (
    <g key={String(reduce)}>
      <path
        ref={route}
        d={routes[goal].path}
        pathLength="1"
        strokeDasharray="1 1"
        strokeDashoffset={reduce ? 0 : 1}
        className="reward-experiment-route"
      />
      <circle
        ref={traveler}
        cx={reduce ? 312 : 40}
        cy={reduce ? endY : 244}
        r="5.5"
        className="reward-experiment-traveler reward-experiment-agent"
      />
    </g>
  );
}

function RewardGoalMarker({ goal, highlighted }: { goal: Goal; highlighted: boolean }) {
  return (
    <g className="reward-experiment-goal" data-goal={goal} data-rewarded={highlighted}>
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
  const barrierPattern = useId();
  return (
    <svg
      className="reward-experiment-board"
      viewBox="0 0 352 284"
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>Ein Agent, zwei mögliche Ziele</title>
      <desc id={descriptionId}>{description}</desc>
      <defs>
        <pattern id={barrierPattern} patternUnits="userSpaceOnUse" width="9" height="9">
          <path d="M-2 2 2-2M0 9 9 0M7 11 11 7" className="reward-barrier-hatch" />
        </pattern>
      </defs>
      {cells.map(({ x, y }, index) => (
        <rect
          key={index}
          x={x}
          y={y}
          width={cellSize}
          height={cellSize}
          rx={cellRadius}
          fill={barriers.includes(index) ? `url(#${barrierPattern})` : undefined}
          className={barriers.includes(index) ? 'reward-experiment-wall' : 'reward-experiment-cell'}
        />
      ))}
      <g className="reward-route-guides" aria-hidden="true">
        <path d={routes.star.path} />
        <path d={routes.treasure.path} />
      </g>
      <RewardGoalMarker goal="star" highlighted={highlightedGoal === 'star'} />
      <RewardGoalMarker goal="treasure" highlighted={highlightedGoal === 'treasure'} />
      <circle cx="40" cy="244" r="15" className="reward-experiment-start" />
      {showAgentAtStart && <circle cx="40" cy="244" r="6" className="reward-experiment-agent" />}
      {children}
    </svg>
  );
}

function RewardPreviewTurn({ goal }: { goal: Goal }) {
  const [arrived, setArrived] = useState(false);
  const onArrival = useCallback(() => setArrived(true), []);
  const fade = useTempoTransition(motionTokens.transition.fade);
  const { x, y } = cells[routes[goal].cell];

  return (
    <PreviewHighlight fadeDuration={0.65} aria-hidden="true">
      <RewardGoalMarker goal={goal} highlighted />
      <RewardPath goal={goal} onArrival={onArrival} />
      {arrived && (
        <g transform={`translate(${x} ${y})`} className="reward-experiment-arrival">
          <Effect asChild fade exit={{}} transition={fade}>
            <g color="var(--success-on-scrim)">
              <rect
                width={cellSize}
                height={cellSize}
                rx={cellRadius}
                fill="var(--media-overlay)"
              />
              <Check x={10} y={10} size={36} strokeWidth={2.5} animate persistOnAnimateEnd />
            </g>
          </Effect>
        </g>
      )}
    </PreviewHighlight>
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
            {activeGoal && <RewardPreviewTurn key={rewardSequence} goal={activeGoal} />}
          </AnimatePresence>
        )}
      </RewardBoard>
    </div>
  );
}

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
