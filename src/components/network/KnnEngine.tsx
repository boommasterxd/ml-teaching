'use client';

import { Effect } from '@animate-ui/react/primitives/effects/effect';
import {
  motionTokens,
  useShouldReduceMotion,
  useTempoTransition,
} from '@animate-ui/react/utils/motion';
import { ANIMATION, NETWORK_STAGES } from '@/constants';
import { KNN_EXAMPLES, type ExampleSignal } from '@/lib/network-demo';
import { KnnPlot, KnnQuery } from './KnnArtwork';

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
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={transition}
            >
              <path
                d={`M${example.query.x} ${example.query.y}L${point.x} ${point.y}`}
                stroke="var(--primary)"
                strokeWidth="1.5"
              />
            </Effect>
            <Effect
              asChild
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={transition}
            >
              <circle cx={point.x} cy={point.y} r="9" stroke="var(--primary)" strokeWidth="1.5" />
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
