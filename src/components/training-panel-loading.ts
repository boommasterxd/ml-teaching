import { useLayoutEffect, useRef, useState } from 'react';
import { createRetryableLoader } from '@/lib/create-retryable-loader';

export type TrainingStep = 'images' | 'training' | 'prediction';
type DeferredStep = Exclude<TrainingStep, 'images'>;

export interface TrainingPanelModules {
  training?: typeof import('./TrainingControls').default;
  prediction?: typeof import('./PredictionPanel').default;
}

const loadPanel = {
  training: createRetryableLoader<TrainingPanelModules>(async () => ({
    training: (await import('./TrainingControls')).default,
  })),
  prediction: createRetryableLoader<TrainingPanelModules>(async () => ({
    prediction: (await import('./PredictionPanel')).default,
  })),
};

interface PanelRequest {
  step: DeferredStep;
  opener: Element | null;
}

type PanelLoadStatus =
  | { state: 'loading'; step: DeferredStep }
  | { state: 'failed'; step: DeferredStep; needsReload: boolean };

type ScheduleActivation = (commit: () => void) => void;
const commitImmediately: ScheduleActivation = (commit) => commit();

function isAvailable(step: TrainingStep, canTrain: boolean, canPredict: boolean) {
  if (step === 'training') return canTrain;
  if (step === 'prediction') return canPredict;
  return true;
}

export function useTrainingPanelLoading(canTrain: boolean, canPredict: boolean) {
  const [modules, setModules] = useState<TrainingPanelModules>({});
  const [prepared, setPrepared] = useState<DeferredStep | null>(null);
  const [status, setStatus] = useState<PanelLoadStatus | null>(null);
  const request = useRef<PanelRequest | null>(null);
  const available = (step: TrainingStep) => isAvailable(step, canTrain, canPredict);
  if (status && !available(status.step)) setStatus(null);
  if (prepared && !available(prepared)) setPrepared(null);
  useLayoutEffect(() => {
    if (request.current && !isAvailable(request.current.step, canTrain, canPredict))
      request.current = null;
  }, [canTrain, canPredict]);

  function rememberModule(step: DeferredStep, loaded: TrainingPanelModules) {
    setModules((current) => (current[step] ? current : { ...current, ...loaded }));
  }

  function prepare(step: DeferredStep) {
    if (!available(step)) return;
    setPrepared(step);
    if (modules[step]) return;
    void loadPanel[step]().then(
      (loaded) => rememberModule(step, loaded),
      () => {},
    );
  }

  function open(
    step: TrainingStep,
    activate: (moveFocus: boolean) => void,
    schedule: ScheduleActivation = commitImmediately,
  ) {
    if (!available(step)) return;
    function complete(moveFocus: boolean, loaded?: TrainingPanelModules) {
      request.current = null;
      schedule(() => {
        if (loaded && step !== 'images') rememberModule(step, loaded);
        setPrepared(null);
        setStatus(null);
        activate(moveFocus);
      });
    }
    if (step === 'images' || modules[step]) {
      complete(true);
      return;
    }
    if (request.current?.step === step) return;
    const pending = { step, opener: document.activeElement };
    request.current = pending;
    setStatus({ state: 'loading', step });
    void loadPanel[step]().then(
      (loaded) => {
        if (request.current === pending)
          complete(pending.opener === document.activeElement, loaded);
        else rememberModule(step, loaded);
      },
      (error: unknown) => {
        if (request.current !== pending) return;
        request.current = null;
        setStatus({
          state: 'failed',
          step,
          needsReload: error instanceof Error && error.name === 'ChunkLoadError',
        });
      },
    );
  }

  return { modules, prepared, status, prepare, open };
}
