'use client';

import { useCallback, useState } from 'react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { motionTokens, useTempoTransition } from '@animate-ui/react/utils/motion';
import { Check } from '../icons/check';
import { RewardGoalMarker, routes, cells, cellSize, cellRadius, type Goal } from './RewardBoard';
import RewardPath from './RewardPath';
import { PreviewHighlight } from './PreviewHighlight';

export function SignalHighlight({ connectors }: { connectors: readonly string[] }) {
  const timing = useTempoTransition({ duration: 0.32, ease: motionTokens.ease.fill });
  return (
    <PreviewHighlight className="home-signal-active" fill="none" strokeWidth="2">
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
          transition={{ ...timing, delay: index * 0.44 }}
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
          transition={{ ...timing, delay: 0.22 + index * 0.44 }}
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
