import type { useTrainingWorkspace } from '@/hooks/useTrainingWorkspace';
import TrainingClassesPanel from './TrainingClassesPanel';
import TrainingControls from './TrainingControls';
import PredictionPanel from './PredictionPanel';
import { EntryReveal } from './ui/entry-reveal';
import { Card } from './ui/card';

/** Stable panel surfaces enter when the consent-gated workspace is ready, without remounting it. */
export default function TrainingPanels({
  workspace,
}: {
  workspace: ReturnType<typeof useTrainingWorkspace>;
}) {
  const { resources, data, dialogs, cardActions } = workspace;
  const { models, consent, camera, prediction } = resources;
  const { classes } = data;
  const ready = Boolean(models.mobilenetModel) && !models.isModelLoading;
  return (
    <div inert={!ready} className="training-panels">
      <TrainingClassesPanel
        entryReady={ready}
        classes={classes.classes}
        duplicateClassNames={data.duplicateClassNames}
        stream={camera.stream}
        cameraActionLabel={consent.cameraConsent ? 'Kamera wechseln' : 'Kamera aktivieren'}
        onCameraAction={consent.cameraConsent ? camera.toggleCamera : consent.requestCameraConsent}
        facingMode={camera.facingMode}
        mainHeadingRef={resources.mainHeadingRef}
        cardActions={cardActions}
        onAddClass={classes.addClass}
        onShowClearConfirm={dialogs.showClearConfirm}
      />
      <EntryReveal active={ready} activation index={1}>
        <Card className="training-console">
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
        </Card>
      </EntryReveal>
    </div>
  );
}
