import { useEffect, useRef, useState } from 'react';
import type { SubscribePredictionFeatures } from '@/hooks/usePredictionLoop';
import type { FeatureProjection, ProjectedPosition } from '@/lib/feature-projection';
import type { MLClass } from '@/types/ml';
import PredictionPointCloud from './PredictionPointCloud';

export { fitFeatureProjection } from '@/lib/feature-projection';
const sampleIntervalMs = 125;

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
    let sampleAfter = 0;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(node);

    const unsubscribe = subscribeToFeatures({
      shouldSample() {
        const now = performance.now();
        if (!visible || now < sampleAfter) return false;
        sampleAfter = now + sampleIntervalMs;
        return true;
      },
      onSample(values) {
        if (visible) setPosition(model.project(values));
      },
    });
    return () => {
      unsubscribe();
      observer.disconnect();
    };
  }, [model, subscribeToFeatures]);

  return (
    <PredictionPointCloud area={area} classes={classes} points={model.points} position={position} />
  );
}
