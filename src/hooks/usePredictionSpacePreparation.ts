import { useEffect, useState } from 'react';
import { createRetryableLoader } from '@/lib/create-retryable-loader';
import type { FeatureProjection } from '@/lib/feature-projection';
import type { MLClass } from '@/types/ml';

type SpaceModule = typeof import('@/components/PredictionSpace');
export type PredictionSpaceResult =
  { Space: SpaceModule['default']; model: FeatureProjection } | { failed: true };

type ProjectionJob = {
  classes: readonly MLClass[];
  result?: PredictionSpaceResult;
};

const loadSpace = createRetryableLoader(async () => {
  const { default: Space, fitFeatureProjection } = await import('@/components/PredictionSpace');
  return { Space, fitFeatureProjection };
});

function matchesDataset(job: ProjectionJob, classes: readonly MLClass[]) {
  return (
    job.classes === classes ||
    (job.classes.length === classes.length &&
      job.classes.every(({ id, images }, index) => {
        const current = classes[index];
        return id === current.id && images === current.images;
      }))
  );
}

/** Retain only the current trained dataset's projection within its workspace. */
export function usePredictionSpacePreparation(
  classes: readonly MLClass[] | undefined,
  automatic: boolean,
) {
  const [job, setJob] = useState<ProjectionJob>();
  const current = job && classes && matchesDataset(job, classes) ? job : undefined;
  if (job && !current) setJob(undefined);
  else if (!job && classes && automatic) setJob({ classes });
  const pending = current && !current.result ? current : undefined;

  useEffect(() => {
    if (!pending) return;
    const controller = new AbortController();
    const { signal } = controller;
    const finish = (result: PredictionSpaceResult) => {
      if (!signal.aborted) {
        setJob((existing) => (existing === pending ? { ...pending, result } : existing));
      }
    };
    void loadSpace()
      .then(async ({ Space, fitFeatureProjection }) => {
        signal.throwIfAborted();
        const model = await fitFeatureProjection(pending.classes, signal);
        finish({ Space, model });
      })
      .catch(() => finish({ failed: true }));
    return () => controller.abort();
  }, [pending]);

  const prepare = () => {
    if (!classes) return;
    setJob((existing) => {
      const failed = existing?.result && 'failed' in existing.result;
      return existing && matchesDataset(existing, classes) && !failed ? existing : { classes };
    });
  };

  return { result: current?.result, prepare };
}
