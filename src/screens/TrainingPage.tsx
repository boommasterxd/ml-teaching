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

/** Browser-only ML workspace inside a build-rendered App Router page. */
export default function TrainingPage() {
  const router = useRouter();
  const { resources, data, dialogs, cardActions } = useTrainingWorkspace();
  const { errors, consent, models, camera, prediction } = resources;
  const { classes } = data;
  const declineConsent = () => router.push('/');
  return (
    <div className="bg-zinc-50 text-zinc-900 font-sans pb-20">
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
      {errors.error && <TrainingError error={errors.error} onReturn={declineConsent} />}
      <div
        inert={!models.mobilenetModel}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid lg:grid-cols-12 gap-6 items-start"
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
