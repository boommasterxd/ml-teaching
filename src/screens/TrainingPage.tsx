'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTrainingWorkspace } from '../hooks/useTrainingWorkspace';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { Badge } from '../components/ui/badge';
import TrainingPanels from '../components/TrainingPanels';
import DeferredTrainingDialogs from '../components/DeferredTrainingDialogs';
import TrainingError from '../components/TrainingError';
import TrainingSetupDialog from '../components/modals/TrainingSetupDialog';
import TrainingWithdrawal from '../components/TrainingWithdrawal';
import { prepareToastViewport } from '@/components/toast-loader';
import { prepareRoute } from '@/components/prepare-route';
import { learningPaths } from '@/lib/learning-paths';
import './training-workspace.css';

const steps = [
  { id: 'training-images', label: 'Bilder sammeln' },
  { id: 'training-model', label: 'Training' },
  { id: 'training-prediction', label: 'Vorhersage' },
] as const;

function TrainingPipeline({ currentStep, ready }: { currentStep: number; ready: boolean }) {
  return (
    <nav aria-label="Trainingsablauf" inert={!ready}>
      <ol className="flex max-w-full flex-wrap gap-1">
        {steps.map(({ id, label }, index) => (
          <li key={id}>
            <Button
              variant="ghost"
              size="sm"
              className="training-step"
              render={
                <a href={`#${id}`} aria-current={index === currentStep ? 'step' : undefined} />
              }
            >
              <Badge
                variant={index === currentStep ? 'default' : 'secondary'}
                className="size-[1.375rem] p-0 text-[0.7rem] tabular-nums"
                aria-hidden="true"
              >
                {index + 1}
              </Badge>
              {label}
            </Button>
          </li>
        ))}
      </ol>
    </nav>
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
  const workspace = useTrainingWorkspace();
  const { resources, data, dialogs } = workspace;
  const { modelError, consent, models, prediction } = resources;
  const { classes } = data;
  const setupStep = getSetupStep(resources);
  // The inline setup and the workspace handoff share the same first-close boundary.
  const [initialSetup, setInitialSetup] = useState(setupStep === 'consent');
  if (initialSetup && setupStep === null) setInitialSetup(false);
  const ready = !initialSetup && Boolean(models.mobilenetModel) && !models.isModelLoading;
  const trainingStep = data.canTrain || data.training.isTraining ? 1 : 0;
  const currentStep = resources.hasTrainedModel && !data.training.isTraining ? 2 : trainingStep;
  const prepareReturn = () => prepareRoute(router, learningPaths.images);
  const declineConsent = () => router.push(learningPaths.images, { transitionTypes: ['nav-back'] });
  return (
    <div className="bg-background text-foreground pb-16 sm:pb-24">
      <div className="training-workspace" inert={setupStep !== null}>
        <PageHeader
          title="Dein Bildmodell"
          description="Welche Motive soll dein Modell unterscheiden? Benenne die Klassen zum Beispiel „Tasse“ und „Stift“."
          rightSlot={<TrainingPipeline currentStep={currentStep} ready={ready} />}
        />
        {modelError && (
          <TrainingError
            message={modelError.message}
            onReturn={declineConsent}
            onReturnIntent={prepareReturn}
          />
        )}
        <TrainingPanels workspace={workspace} ready={ready} />
        <TrainingWithdrawal
          visible={consent.hasConsented && !initialSetup && !models.isModelLoading}
        />
      </div>
      <DeferredTrainingDialogs
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
