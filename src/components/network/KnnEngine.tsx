'use client';

import { Effect } from '@animate-ui/react/primitives/effects/effect';
import {
  motionTokens,
  useShouldReduceMotion,
  useTempoTransition,
} from '@animate-ui/react/utils/motion';
import { ANIMATION, NETWORK_STAGES } from '@/constants';
import type { KnnPosition } from '@/lib/knn';
import { KNN_EXAMPLES, type ExampleSignal } from '@/lib/network-demo';
import { KNN_RING_RADIUS, KnnPlot, KnnQuery } from './KnnArtwork';

function connectionToRing(query: KnnPosition, point: KnnPosition) {
  const dx = point.x - query.x;
  const dy = point.y - query.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= KNN_RING_RADIUS) return undefined;

  const inset = KNN_RING_RADIUS / distance;
  return `M${query.x} ${query.y}L${point.x - dx * inset} ${point.y - dy * inset}`;
}

export default function KnnEngine({
  signal,
  step,
  sequence,
}: {
  signal: ExampleSignal;
  step: number;
  sequence: number;
}) {
  const reduce = useShouldReduceMotion();
  const transition = useTempoTransition({
    duration: reduce ? 0 : ANIMATION.STEP_DURATION_MS / 1000,
    ease: motionTokens.ease.draw,
  });
  const fadeTransition = useTempoTransition(motionTokens.transition.fade);
  const example = KNN_EXAMPLES[signal];
  return (
    <KnnPlot>
      {step >= NETWORK_STAGES.NEIGHBORS &&
        example.neighbors.map((point) => (
          <g key={`${sequence}-${point.id}`}>
            <Effect
              asChild
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={transition}
            >
              <path
                d={connectionToRing(example.query, point)}
                stroke="var(--primary)"
                strokeWidth="1.5"
              />
            </Effect>
            <Effect
              asChild
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={transition}
            >
              <circle
                cx={point.x}
                cy={point.y}
                r={KNN_RING_RADIUS}
                stroke="var(--primary)"
                strokeWidth="1.5"
              />
            </Effect>
          </g>
        ))}
      {step >= NETWORK_STAGES.MATCHING && (
        <Effect asChild key={`${sequence}-query`} fade={!reduce} transition={fadeTransition}>
          <g>
            <KnnQuery {...example.query} />
          </g>
        </Effect>
      )}
    </KnnPlot>
  );
}
