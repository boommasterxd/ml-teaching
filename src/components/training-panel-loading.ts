import { useLayoutEffect, useRef, useState } from 'react';

export type TrainingStep = 'images' | 'training' | 'prediction';
type DeferredStep = Exclude<TrainingStep, 'images'>;

export interface TrainingPanelModules {
  training?: typeof import('./TrainingControls').default;
  prediction?: typeof import('./PredictionPanel').default;
}

function shareModule(load: () => Promise<TrainingPanelModules>) {
  let pending: Promise<TrainingPanelModules> | undefined;
  return () => {
    pending ??= load().catch((error: unknown) => {
      pending = undefined;
      throw error;
    });
    return pending;
  };
}

const loadPanel = {
  training: shareModule(async () => ({ training: (await import('./TrainingControls')).default })),
  prediction: shareModule(async () => ({
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

  function open(step: TrainingStep, activate: (moveFocus: boolean) => void) {
    if (!available(step)) return;
    if (step === 'images' || modules[step]) {
      request.current = null;
      setPrepared(null);
      setStatus(null);
      activate(true);
      return;
    }
    if (request.current?.step === step) return;
    const pending = { step, opener: document.activeElement };
    request.current = pending;
    setStatus({ state: 'loading', step });
    void loadPanel[step]().then(
      (loaded) => {
        rememberModule(step, loaded);
        if (request.current !== pending) return;
        request.current = null;
        setPrepared(null);
        setStatus(null);
        activate(pending.opener === document.activeElement);
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
