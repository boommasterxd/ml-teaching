'use client';

import { useCallback, useState } from 'react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import {
  motionTokens,
  scaleTransition,
  useMotionTokens,
  useTempoTransition,
} from '@animate-ui/react/utils/motion';
import { CheckCircle2 } from '../icons/check-circle2';
import { RewardGoalMarker, routes, cells, cellSize, cellRadius, type Goal } from './RewardBoard';
import RewardPath from './RewardPath';
import { PreviewHighlight } from './PreviewHighlight';

export const signalPreviewFade = { duration: 0.45, ease: motionTokens.ease.color };
export const rewardPreviewFade = { ...motionTokens.transition.fade, duration: 0.65 };

export function SignalHighlight({ connectors }: { connectors: readonly string[] }) {
  const { tempo } = useMotionTokens();
  const ease = motionTokens.ease.fill;
  const stageSpacing = 0.52;
  return (
    <PreviewHighlight
      fadeTransition={signalPreviewFade}
      className="home-signal-active"
      fill="none"
      strokeWidth="2"
    >
      {[
        { x: 14, width: 150 },
        { x: 234, width: 132 },
        { x: 436, width: 150 },
      ].map(({ x, width }, index) => (
        <Effect
          key={x}
          asChild
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={scaleTransition({ duration: 0.52, ease, delay: index * stageSpacing }, tempo)}
        >
          <rect x={x} y="63" width={width} height="142" rx="20" />
        </Effect>
      ))}
      {connectors.map((d, index) => (
        <Effect
          key={d}
          asChild
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={scaleTransition(
            { duration: 0.32, ease, delay: index * stageSpacing + 0.28 },
            tempo,
          )}
        >
          <path d={d} />
        </Effect>
      ))}
    </PreviewHighlight>
  );
}

export function RewardPreviewTurn({ goal }: { goal: Goal }) {
  const [arrived, setArrived] = useState(false);
  const onArrival = useCallback(() => setArrived(true), []);
  const fade = useTempoTransition(motionTokens.transition.fade);
  const { x, y } = cells[routes[goal].cell];

  return (
    <PreviewHighlight fadeTransition={rewardPreviewFade} aria-hidden="true">
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
              <CheckCircle2 x={10} y={10} size={36} strokeWidth={2.5} animate persistOnAnimateEnd />
            </g>
          </Effect>
        </g>
      )}
    </PreviewHighlight>
  );
}
