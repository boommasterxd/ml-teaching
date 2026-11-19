import type { useTrainingWorkspace } from '@/hooks/useTrainingWorkspace';
import TrainingClassesPanel from './TrainingClassesPanel';
import TrainingControls from './TrainingControls';
import PredictionPanel from './PredictionPanel';
import { Card } from './ui/card';

/** Stable panel surfaces enter when the consent-gated workspace is ready, without remounting it. */
export default function TrainingPanels({
  workspace,
  ready,
}: {
  workspace: ReturnType<typeof useTrainingWorkspace>;
  ready: boolean;
}) {
  const { resources, data, dialogs, cardActions } = workspace;
  const { consent, camera, prediction } = resources;
  const { classes } = data;
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
      <Card className="training-console">
        <TrainingControls
          entryReady={ready}
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
          entryReady={ready}
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
    </div>
  );
}
