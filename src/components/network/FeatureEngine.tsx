'use client';

import { Fragment } from 'react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { motionTokens, useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import type { ExampleSignal } from '@/lib/network-demo';
import { FEATURE_LAYERS, FeatureFoundation, FeatureLayer } from './FeatureArtwork';

export default function FeatureEngine({
  step,
  sequence,
  signal,
}: {
  step: number;
  sequence: number;
  signal: ExampleSignal;
}) {
  const reduce = useShouldReduceMotion();
  return (
    <svg viewBox="0 0 220 200" fill="none" aria-hidden="true" className="size-full">
      <FeatureFoundation />
      {FEATURE_LAYERS.map((layer) => (
        <Fragment key={layer}>
          <FeatureLayer layer={layer} example={signal} />
          {step >= layer + 2 && (
            <Effect
              asChild
              key={`${sequence}-${layer}`}
              initial={reduce ? false : { clipPath: 'inset(0% 100% 0% 0%)' }}
              animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
              transition={{
                duration: reduce ? 0 : 0.36,
                ease: motionTokens.ease.draw,
              }}
            >
              <g>
                <FeatureLayer layer={layer} example={signal} signal />
              </g>
            </Effect>
          )}
        </Fragment>
      ))}
    </svg>
  );
}
