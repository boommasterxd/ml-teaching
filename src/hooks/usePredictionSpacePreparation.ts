import { useEffect, useState } from 'react';
import type { FeatureProjection } from '@/lib/feature-projection';
import type { MLClass } from '@/types/ml';

type SpaceModule = typeof import('@/components/PredictionSpace');
export type PredictionSpaceResult =
  { Space: SpaceModule['default']; model: FeatureProjection } | { failed: true };

type ProjectionJob = {
  classes: readonly MLClass[];
  result?: PredictionSpaceResult;
};

let pendingModule: Promise<SpaceModule> | undefined;

function loadSpace() {
  pendingModule ??= import('@/components/PredictionSpace').catch((error: unknown) => {
    pendingModule = undefined;
    throw error;
  });
  return pendingModule;
}

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
      .then(async ({ default: Space, fitFeatureProjection }) => {
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
