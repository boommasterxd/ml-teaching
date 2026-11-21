'use client';

import { useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { useTrainingWorkspace } from '../hooks/useTrainingWorkspace';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Spinner } from '../components/ui/spinner';
import TrainingPanels from '../components/TrainingPanels';
import { useTrainingPanelLoading, type TrainingStep } from '../components/training-panel-loading';
import DeferredTrainingDialogs from '../components/DeferredTrainingDialogs';
import TrainingError from '../components/TrainingError';
import TrainingSetupDialog from '../components/modals/TrainingSetupDialog';
import { TrainingFooterWithdrawal } from '../components/TrainingWithdrawal';
import { prepareToastViewport } from '@/components/toast-loader';
import { prepareRoute } from '@/components/prepare-route';
import { learningPaths } from '@/lib/learning-paths';
import './training-workspace.css';

const steps = [
  { step: 'images', id: 'training-images', label: 'Bilder sammeln' },
  { step: 'training', id: 'training-model', label: 'Training' },
  { step: 'prediction', id: 'training-prediction', label: 'Vorhersage' },
] as const;

function TrainingPipeline({
  currentStep,
  ready,
  canTrain,
  canPredict,
  onSelect,
  onPrepare,
  navigation,
}: {
  currentStep: TrainingStep;
  ready: boolean;
  canTrain: boolean;
  canPredict: boolean;
  onSelect: (step: TrainingStep) => void;
  onPrepare: (step: TrainingStep) => void;
  navigation: React.Ref<HTMLElement>;
}) {
  return (
    <nav ref={navigation} aria-label="Trainingsablauf" inert={!ready} className="scroll-mt-24">
      <ol className="grid grid-cols-3 gap-1 lg:flex">
        {steps.map(({ step, label }, index) => (
          <li key={step}>
            <Button
              id={`training-step-${step}`}
              variant="ghost"
              size="sm"
              className="training-step"
              aria-current={step === currentStep ? 'step' : undefined}
              disabled={step === 'training' ? !canTrain : step === 'prediction' && !canPredict}
              onClick={() => onSelect(step)}
              onPointerEnter={() => onPrepare(step)}
              onFocus={() => onPrepare(step)}
              onPointerDown={() => onPrepare(step)}
            >
              <Badge
                variant={step === currentStep ? 'default' : 'secondary'}
                className="size-[1.0625rem] p-0 text-[0.65rem] tabular-nums sm:size-[1.375rem] sm:text-[0.7rem]"
                aria-hidden="true"
              >
                {index + 1}
              </Badge>
              {index === 0 ? (
                <>
                  <span aria-hidden="true" className="sm:hidden">
                    Bilder
                  </span>
                  <span className="sr-only sm:not-sr-only">{label}</span>
                </>
              ) : (
                label
              )}
            </Button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function useTrainingNavigation(
  canTrain: boolean,
  canPredict: boolean,
  selection: TrainingStep,
  setSelection: Dispatch<SetStateAction<TrainingStep>>,
) {
  const { modules, prepared, status, prepare, open } = useTrainingPanelLoading(
    canTrain,
    canPredict,
  );
  const navigation = useRef<HTMLElement>(null);
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
    const heading = steps.find(({ step }) => step === current);
    if (heading) document.getElementById(heading.id)?.focus({ preventScroll: true });
    navigation.current?.scrollIntoView?.({ block: 'start', behavior: 'instant' });
  }, [current]);
  const select = (step: TrainingStep) => {
    open(step, (focusOnCommit) => {
      if (step !== current) moveFocus.current = focusOnCommit;
      setSelection(step);
    });
  };
  const onPrepare = (step: TrainingStep) => {
    if (step !== 'images' && step !== current) prepare(step);
  };
  return { current, navigation, select, onPrepare, modules, prepared, status };
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

function getSetupStep({
  consent,
  models,
  showCameraPrompt,
}: ReturnType<typeof useTrainingWorkspace>['resources']) {
  if (consent.showConsentModal) return 'consent';
  if (models.isModelLoading) return 'loading';
  return showCameraPrompt ? 'camera' : null;
}

/** Browser-only ML workspace inside a build-rendered App Router page. */
export default function TrainingPage() {
  const router = useRouter();
  const [selection, setSelection] = useState<TrainingStep>('images');
  const workspace = useTrainingWorkspace(selection);
  const { resources, data, dialogs } = workspace;
  const { error, consent, models } = resources;
  const modelFailed = error?.category === 'model';
  const { classes } = data;
  const setupStep = getSetupStep(resources);
  // The inline setup and the workspace handoff share the same first-close boundary.
  const [initialSetup, setInitialSetup] = useState(setupStep === 'consent');
  if (initialSetup && setupStep === null) setInitialSetup(false);
  const ready = !initialSetup && Boolean(models.mobilenetModel) && !models.isModelLoading;
  const canPredict = data.canTrain && resources.hasTrainedModel && !data.training.isTraining;
  const flow = useTrainingNavigation(data.canTrain, canPredict, selection, setSelection);
  const canWithdrawCameraInPreview =
    resources.camera.active && (flow.current !== 'images' || classes.classes.length > 0);
  const revokeCameraInFooter =
    consent.cameraConsent && !canWithdrawCameraInPreview ? resources.revokeCamera : undefined;
  const showFooterWithdrawal = consent.hasConsented && !initialSetup && setupStep === null;
  const prepareReturn = () => prepareRoute(router, learningPaths.images);
  const declineConsent = () => router.push(learningPaths.images, { transitionTypes: ['nav-back'] });
  return (
    <div className="bg-background text-foreground pb-10 sm:pb-16">
      <div className="training-workspace" inert={setupStep !== null}>
        <PageHeader
          title="Dein Bildmodell"
          description="Welche Motive soll dein Modell unterscheiden? Benenne die Klassen zum Beispiel „Tasse“ und „Stift“."
          rightSlot={
            <TrainingPipeline
              currentStep={flow.current}
              ready={ready}
              canTrain={data.canTrain}
              canPredict={canPredict}
              onSelect={flow.select}
              onPrepare={flow.onPrepare}
              navigation={flow.navigation}
            />
          }
        />
        {error && (
          <TrainingError
            message={
              modelFailed
                ? error.message
                : `${error.message} Du kannst Bilder hochladen. Beim Neuladen gehen deine Trainingsdaten verloren.`
            }
            onReturn={modelFailed ? declineConsent : undefined}
            onReturnIntent={modelFailed ? prepareReturn : undefined}
          />
        )}
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
          onSelect={flow.select}
          onPrepare={flow.onPrepare}
        />
      </div>
      {showFooterWithdrawal && <TrainingFooterWithdrawal onRevokeCamera={revokeCameraInFooter} />}
      <DeferredTrainingDialogs
        modal={dialogs.modal}
        classes={classes.classes}
        closeModal={dialogs.closeModal}
        removeImage={classes.removeImage}
        clearClass={classes.clearClass}
        removeClass={classes.removeClass}
      />
      <TrainingSetupDialog
        initialContent={initialSetup}
        step={setupStep}
        loadingText={models.loadingText}
        onDeclineConsent={declineConsent}
        onDeclineConsentIntent={prepareReturn}
        onConfirmConsent={() => {
          prepareToastViewport();
          consent.grantConsent();
        }}
        onDeclineCamera={consent.declineCameraConsent}
        onConfirmCamera={consent.grantCameraConsent}
      />
    </div>
  );
}
