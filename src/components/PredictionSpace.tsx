import { useEffect, useRef, useState } from 'react';
import type { SubscribePredictionFeatures } from '@/hooks/usePredictionLoop';
import {
  fitFeatureProjection,
  type FeatureProjection,
  type ProjectedPosition,
} from '@/lib/feature-projection';
import type { MLClass } from '@/types/ml';
import PredictionPointCloud from './PredictionPointCloud';

const projections = new WeakMap<readonly MLClass[], FeatureProjection>();
const sampleIntervalMs = 125;

/** Reuse the fitted space while this immutable set of training images is current. */
export async function prepareSpace(classes: readonly MLClass[], signal: AbortSignal) {
  const cached = projections.get(classes);
  if (cached) return cached;
  const projection = await fitFeatureProjection(classes, signal);
  signal.throwIfAborted();
  projections.set(classes, projection);
  return projection;
}

export default function PredictionSpace({
  classes,
  model,
  subscribeToFeatures,
}: {
  classes: readonly MLClass[];
  model: FeatureProjection;
  subscribeToFeatures: SubscribePredictionFeatures;
}) {
  const area = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<ProjectedPosition | null>(null);

  useEffect(() => {
    const node = area.current;
    if (!node) return;
    let visible = false;
    let disposed = false;
    let sampleAfter = 0;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(node);

    const unsubscribe = subscribeToFeatures((features) => {
      const now = performance.now();
      if (!visible || now < sampleAfter) return;
      sampleAfter = now + sampleIntervalMs;
      return (async () => {
        try {
          const values = await features.data();
          if (!disposed && visible && values instanceof Float32Array) {
            setPosition(model.project(values));
          }
        } catch {
          // An optional visualization read must not count as a classification failure.
        }
      })();
    });
    return () => {
      disposed = true;
      unsubscribe();
      observer.disconnect();
    };
  }, [model, subscribeToFeatures]);

  return (
    <div ref={area} className="pointer-events-none absolute inset-0">
      <PredictionPointCloud classes={classes} points={model.points} position={position} />
    </div>
  );
}
