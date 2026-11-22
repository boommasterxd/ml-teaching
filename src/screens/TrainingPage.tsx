'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
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
import type { SetupStep } from '../components/modals/SetupStepTransition';
import { useTrainingSession } from '@/components/training/TrainingEntryContext';
import { useEntryViewportReady, useInitialEntry } from '@/components/ui/entry-policy';
import { prepareRoute } from '@/components/prepare-route';
import { learningPaths } from '@/lib/learning-paths';
import { toast } from '@/lib/toast';
import type { AppError } from '@/types/errors';
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
      <ol className="flex flex-wrap gap-1">
        {steps.map(({ step, label }, index) => (
          <li key={step} className="grow lg:grow-0">
            <Button
              id={`training-step-${step}`}
              variant="ghost"
              size="sm"
              className="training-step hover:bg-transparent dark:hover:bg-transparent"
              aria-current={step === currentStep ? 'step' : undefined}
              disabled={step === 'training' ? !canTrain : step === 'prediction' && !canPredict}
              onClick={() => onSelect(step)}
              onPointerEnter={() => onPrepare(step)}
              onFocus={() => onPrepare(step)}
              onPointerDown={() => onPrepare(step)}
            >
              <span className="training-step-content transition-colors">
                <Badge
                  variant={step === currentStep ? 'default' : 'secondary'}
                  className="training-step-number p-0 tabular-nums max-sm:pt-px max-sm:leading-none"
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
              </span>
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
  if (!consent.wasRestored && models.isModelLoading) return 'loading';
  return showCameraPrompt ? 'camera' : null;
}

/** Browser-only ML workspace inside a build-rendered App Router page. */
export default function TrainingPage() {
  const { workspaceVersion } = useTrainingSession();
  return <TrainingWorkspace key={workspaceVersion} initialWorkspace={workspaceVersion === 0} />;
}

function useTrainingArrival(ready: boolean, heading: React.RefObject<HTMLHeadingElement | null>) {
  const focused = useRef(false);
  useLayoutEffect(() => {
    if (!ready || focused.current) return;
    focused.current = true;
    heading.current?.focus({ preventScroll: true });
  }, [ready, heading]);
}

function useSetupPresentation(
  step: SetupStep | null,
  canShow: boolean,
  wasRestored: boolean,
  heading: React.RefObject<HTMLHeadingElement | null>,
) {
  const requested = canShow ? step : null;
  const [lastStep, setLastStep] = useState(requested);
  const [initialSetup, setInitialSetup] = useState(step === 'consent');
  const [focusHeading, setFocusHeading] = useState(false);
  const skipped = !canShow || (wasRestored && lastStep === 'consent' && requested === null);
  if (requested && requested !== lastStep) setLastStep(requested);
  if (skipped && lastStep !== null) {
    setLastStep(null);
    setInitialSetup(false);
  }

  useLayoutEffect(() => {
    if (focusHeading) heading.current?.focus({ preventScroll: true });
  }, [focusHeading, heading]);

  function onExited() {
    if (requested !== null || lastStep === null) return;
    setLastStep(null);
    setInitialSetup(false);
    if (lastStep === 'camera') setFocusHeading(true);
  }

  return {
    step: skipped ? requested : (requested ?? lastStep),
    open: requested !== null,
    initialSetup,
    onExited,
    restoreFocus: true,
  };
}

function useCameraErrorNotice(error: AppError | null, canNotify: boolean) {
  useEffect(() => {
    if (canNotify && error?.category === 'camera') {
      toast.error(`${error.message} Du kannst Bilder hochladen.`, { id: 'training-camera' });
    }
  }, [canNotify, error]);
}

function TrainingWorkspace({ initialWorkspace }: { initialWorkspace: boolean }) {
  const router = useRouter();
  const {
    engine,
    pendingArrival,
    revokeConsent,
    grantConsent,
    setupSuppressed,
    prepareWithdrawal,
  } = useTrainingSession();
  const initialDocument = useInitialEntry();
  const entryViewportReady = useEntryViewportReady();
  const [selection, setSelection] = useState<TrainingStep>('images');
  const workspace = useTrainingWorkspace(selection, engine);
  const { resources, data, dialogs } = workspace;
  const { error, consent, models } = resources;
  const setupStep = getSetupStep(resources);
  const { initialSetup, ...setup } = useSetupPresentation(
    setupStep,
    !setupSuppressed && (initialDocument || entryViewportReady),
    consent.wasRestored,
    resources.mainHeadingRef,
  );
  const ready = !initialSetup && Boolean(models.mobilenetModel) && !models.isModelLoading;
  const canPredict = data.canTrain && resources.hasTrainedModel && !data.training.isTraining;
  const flow = useTrainingNavigation(data.canTrain, canPredict, selection, setSelection);
  useTrainingArrival(pendingArrival && entryViewportReady, resources.mainHeadingRef);
  useCameraErrorNotice(error, entryViewportReady && setup.step === null);
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
        {consent.wasRestored && models.isModelLoading && (
          <p role="status" className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner aria-hidden="true" /> Bildtraining wird geladen …
          </p>
        )}
        {error?.category === 'model' && setup.step === null && (
          <TrainingError
            message={error.message}
            onReturn={declineConsent}
            onReturnIntent={prepareReturn}
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
      <DeferredTrainingDialogs
        modal={dialogs.modal}
        classes={data.classes.classes}
        closeModal={dialogs.closeModal}
        removeImage={data.classes.removeImage}
        clearClass={data.classes.clearClass}
        removeClass={data.classes.removeClass}
      />
      <TrainingSetupDialog
        initialContent={initialDocument && initialWorkspace && initialSetup}
        {...setup}
        loadingText={models.loadingText}
        onDeclineConsent={declineConsent}
        onDeclineConsentIntent={prepareReturn}
        onConfirmConsent={grantConsent}
        onWithdrawLoading={revokeConsent}
        onWithdrawIntent={prepareWithdrawal}
        onDeclineCamera={consent.declineCameraConsent}
        onConfirmCamera={consent.grantCameraConsent}
      />
    </div>
  );
}
