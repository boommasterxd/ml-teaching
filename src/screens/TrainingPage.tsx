'use client';

import { useRouter } from 'next/navigation';
import { Camera, SwitchCamera } from '../components/icons';
import { useTrainingWorkspace } from '../hooks/useTrainingWorkspace';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import TrainingClassesPanel from '../components/TrainingClassesPanel';
import TrainingControls from '../components/TrainingControls';
import PredictionPanel from '../components/PredictionPanel';
import TrainingPageModals from '../components/TrainingPageModals';
import TrainingError from '../components/TrainingError';
import { ConsentModal, CameraConsentModal, LoadingModal } from '../components/modals';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { Separator } from '../components/ui/separator';

function TrainingPipeline({
  canTrain,
  hasTrainedModel,
}: {
  canTrain: boolean;
  hasTrainedModel: boolean;
}) {
  const currentStep = hasTrainedModel ? 2 : canTrain ? 1 : 0;
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <div className="flex flex-col gap-5 pb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:pb-8">
        <p className="eyebrow">Lernlabor</p>
        <ol aria-label="Trainingsablauf" className="grid grid-cols-3 gap-2 sm:gap-6">
          {['Bilder sammeln', 'Training', 'Vorhersage'].map((label, index) => {
            const state =
              index < currentStep ? 'complete' : index === currentStep ? 'active' : 'idle';
            return (
              <li
                key={label}
                data-state={state}
                aria-current={state === 'active' ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 sm:gap-3',
                  state === 'idle' ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                <Badge
                  variant={state === 'active' ? 'default' : 'secondary'}
                  data-state={state}
                  aria-hidden="true"
                >{`0${index + 1}`}</Badge>
                <span className="text-xs sm:text-sm">{label}</span>
              </li>
            );
          })}
        </ol>
      </div>
      <Separator />
    </div>
  );
}

/** Browser-only ML workspace inside a build-rendered App Router page. */
export default function TrainingPage() {
  const router = useRouter();
  const { resources, data, dialogs, cardActions } = useTrainingWorkspace();
  const { errors, consent, models, camera, prediction } = resources;
  const { classes } = data;
  const declineConsent = () => router.push('/');
  return (
    <div className="bg-background text-foreground pb-16 sm:pb-24">
      <PageHeader
        title="Modell trainieren"
        rightSlot={
          <Button
            variant="ghost"
            size="icon"
            onClick={consent.cameraConsent ? camera.toggleCamera : consent.requestCameraConsent}
            disabled={!models.mobilenetModel}
            title={consent.cameraConsent ? 'Kamera wechseln' : 'Kamera aktivieren'}
            aria-label={consent.cameraConsent ? 'Kamera wechseln' : 'Kamera aktivieren'}
          >
            {consent.cameraConsent ? (
              <SwitchCamera data-icon="inline-start" aria-hidden="true" />
            ) : (
              <Camera data-icon="inline-start" aria-hidden="true" />
            )}
          </Button>
        }
      />
      <TrainingPipeline canTrain={data.canTrain} hasTrainedModel={resources.hasTrainedModel} />
      {errors.error && <TrainingError error={errors.error} onReturn={declineConsent} />}
      <div
        inert={!models.mobilenetModel}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid lg:grid-cols-12 gap-8 items-start lg:gap-10"
      >
        <TrainingClassesPanel
          classes={classes.classes}
          duplicateClassNames={data.duplicateClassNames}
          stream={camera.stream}
          facingMode={camera.facingMode}
          mainHeadingRef={resources.mainHeadingRef}
          cardActions={cardActions}
          onAddClass={classes.addClass}
          onShowClearConfirm={dialogs.showClearConfirm}
        />
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 min-w-0">
          <TrainingControls
            classes={classes.classes}
            canTrain={data.canTrain}
            hasPendingUploads={data.activity.hasUploads}
            isTraining={data.training.isTraining}
            hasTrainedModel={resources.hasTrainedModel}
            hasInvalidNames={data.training.hasInvalidNames}
            hasDuplicateNames={data.hasDuplicateNames}
            onTrain={data.trainModel}
          />
          <PredictionPanel
            hasCamera={camera.stream !== null}
            classes={classes.classes}
            prediction={prediction.prediction}
            isPredicting={prediction.isPredicting}
            hasTrainedModel={resources.hasTrainedModel}
            facingMode={camera.facingMode}
            predictVideoRef={resources.predictVideoRef}
            onStartPredicting={resources.startPredicting}
            onStopPredicting={prediction.stopPredicting}
          />
        </div>
      </div>
      <TrainingPageModals
        modal={dialogs.modal}
        classes={classes.classes}
        classifier={models.classifier}
        closeModal={dialogs.closeModal}
        removeImage={classes.removeImage}
        clearClass={classes.clearClass}
        removeClass={classes.removeClass}
        resetClasses={classes.resetClasses}
        setHasTrainedModel={resources.setHasTrainedModel}
        stopPredicting={prediction.stopPredicting}
      />
      <ConsentModal
        isOpen={consent.showConsentModal}
        onDecline={declineConsent}
        onConfirm={consent.grantConsent}
      />
      <LoadingModal
        isOpen={consent.hasConsented && models.isModelLoading}
        loadingText={models.loadingText}
      />
      <CameraConsentModal
        isOpen={resources.showCameraPrompt}
        onDecline={consent.declineCameraConsent}
        onConfirm={consent.grantCameraConsent}
      />
    </div>
  );
}
