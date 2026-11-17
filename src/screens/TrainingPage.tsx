'use client';

import { useRouter } from 'next/navigation';
import { Camera } from '../components/icons/camera';
import { SwitchCamera } from '../components/icons/switch-camera';
import { useTrainingWorkspace } from '../hooks/useTrainingWorkspace';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import TrainingPanels from '../components/TrainingPanels';
import TrainingPageModals from '../components/TrainingPageModals';
import TrainingError from '../components/TrainingError';
import { ConsentModal, CameraConsentModal, LoadingModal } from '../components/modals';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { Separator } from '../components/ui/separator';
import TrainingWithdrawal from '../components/TrainingWithdrawal';
import { EntryReveal } from '../components/ui/entry-reveal';

function TrainingPipeline({
  canTrain,
  hasTrainedModel,
  ready,
}: {
  canTrain: boolean;
  hasTrainedModel: boolean;
  ready: boolean;
}) {
  const currentStep = hasTrainedModel ? 2 : canTrain ? 1 : 0;
  return (
    <EntryReveal kind="text" active={ready} activation asChild>
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
    </EntryReveal>
  );
}

/** Browser-only ML workspace inside a build-rendered App Router page. */
export default function TrainingPage() {
  const router = useRouter();
  const workspace = useTrainingWorkspace();
  const { resources, data, dialogs } = workspace;
  const { errors, consent, models, camera, prediction } = resources;
  const { classes } = data;
  const ready = Boolean(models.mobilenetModel) && !models.isModelLoading;
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
      <TrainingPipeline
        canTrain={data.canTrain}
        hasTrainedModel={resources.hasTrainedModel}
        ready={ready}
      />
      {errors.error && <TrainingError error={errors.error} onReturn={declineConsent} />}
      <TrainingPanels workspace={workspace} />
      {consent.hasConsented && <TrainingWithdrawal />}
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
