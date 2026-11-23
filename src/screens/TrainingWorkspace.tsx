'use client';

import {
  addTransitionType,
  startTransition,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { useTrainingWorkspace } from '../hooks/useTrainingWorkspace';
import Button from '../components/Button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Spinner } from '../components/ui/spinner';
import TrainingPanels from '../components/TrainingPanels';
import { useTrainingPanelLoading, type TrainingStep } from '../components/training-panel-loading';
import DeferredTrainingDialogs from '../components/DeferredTrainingDialogs';
import { useTrainingSession } from '@/components/training/TrainingEntryContext';
import { useMotionPreference } from '@/components/ui/use-motion-preference';
import { TrainingWorkspaceHeader, trainingSteps } from '@/components/TrainingCollectionFrame';

function useTrainingNavigation(
  canTrain: boolean,
  canPredict: boolean,
  selection: TrainingStep,
  setSelection: Dispatch<SetStateAction<TrainingStep>>,
) {
  const { reduce } = useMotionPreference();
  const { modules, prepared, status, prepare, open } = useTrainingPanelLoading(
    canTrain,
    canPredict,
  );
  const previous = useRef(selection);
  const moveFocus = useRef(true);
  const current = !canTrain
    ? 'images'
    : selection === 'prediction' && !canPredict
      ? 'training'
      : selection;
  if (selection !== current) setSelection(current);
  useLayoutEffect(() => {
    if (previous.current === current) return;
    previous.current = current;
    const shouldMoveFocus = moveFocus.current;
    moveFocus.current = true;
    if (!shouldMoveFocus) return;
    const headingId = trainingSteps.find(({ step }) => step === current)?.id;
    const heading = headingId && document.getElementById(headingId);
    if (!heading) return;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView?.({ block: 'nearest', behavior: 'instant' });
  }, [current]);
  const select = (step: TrainingStep) => {
    const from = trainingSteps.findIndex((item) => item.step === current);
    const to = trainingSteps.findIndex((item) => item.step === step);
    const type = to < from ? 'training-back' : 'training-forward';
    open(
      step,
      (focusOnCommit) => {
        if (step !== current) moveFocus.current = focusOnCommit;
        setSelection(step);
      },
      reduce || from === to
        ? undefined
        : (commit) =>
            startTransition(() => {
              addTransitionType(type);
              commit();
            }),
    );
  };
  const onPrepare = (step: TrainingStep) => {
    if (step !== 'images' && step !== current) prepare(step);
  };
  return { current, select, onPrepare, modules, prepared, status };
}

function TrainingPanelFeedback({
  status,
  retry,
}: {
  status: ReturnType<typeof useTrainingNavigation>['status'];
  retry: (step: TrainingStep) => void;
}) {
  if (!status) return null;
  if (status.state === 'loading')
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner aria-hidden="true" /> Ansicht wird geladen …
      </p>
    );
  return (
    <Alert variant="destructive">
      <AlertDescription>
        <p>Die Ansicht konnte nicht geladen werden.</p>
        {status.needsReload ? (
          <p>
            Lade die Seite neu, wenn du fortfahren möchtest. Dabei gehen deine Trainingsdaten
            verloren.
          </p>
        ) : (
          <Button variant="outline" size="sm" onClick={() => retry(status.step)}>
            Erneut versuchen
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/** The form, capture and panel state mount only after model consent. */
export default function TrainingWorkspace({
  ready,
  focusRequest,
  notice,
}: {
  ready: boolean;
  focusRequest: number;
  notice?: ReactNode;
}) {
  const { engine } = useTrainingSession();
  const [selection, setSelection] = useState<TrainingStep>('images');
  const workspace = useTrainingWorkspace(selection, engine);
  const { resources, data, dialogs } = workspace;
  const canPredict = data.canTrain && resources.hasTrainedModel && !data.training.isTraining;
  const flow = useTrainingNavigation(data.canTrain, canPredict, selection, setSelection);

  const focusedRequest = useRef(0);
  const { mainHeadingRef } = resources;
  useLayoutEffect(() => {
    if (!ready || focusRequest === 0 || focusRequest === focusedRequest.current) return;
    const heading = mainHeadingRef.current;
    if (!heading) return;
    focusedRequest.current = focusRequest;
    heading.focus({ preventScroll: true });
  }, [ready, focusRequest, mainHeadingRef]);

  return (
    <>
      <TrainingWorkspaceHeader
        currentStep={flow.current}
        ready={ready}
        canTrain={data.canTrain}
        canPredict={canPredict}
        onSelect={flow.select}
        onPrepare={flow.onPrepare}
      />
      {notice}
      <TrainingPanelFeedback
        status={flow.status}
        retry={(step) => {
          document.getElementById(`training-step-${step}`)?.focus({ preventScroll: true });
          flow.select(step);
        }}
      />
      <TrainingPanels
        workspace={workspace}
        ready={ready}
        step={flow.current}
        modules={flow.modules}
        prepared={flow.prepared}
        openingPrediction={flow.status?.state === 'loading' && flow.status.step === 'prediction'}
        onSelect={flow.select}
        onPrepare={flow.onPrepare}
      />
      <DeferredTrainingDialogs
        modal={dialogs.modal}
        classes={data.classes.classes}
        closeModal={dialogs.closeModal}
        removeImage={data.classes.removeImage}
        clearClass={data.classes.clearClass}
        removeClass={data.classes.removeClass}
      />
    </>
  );
}
