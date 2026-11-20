import type { useTrainingWorkspace } from '@/hooks/useTrainingWorkspace';
import TrainingClassesPanel from './TrainingClassesPanel';
import TrainingControls from './TrainingControls';
import PredictionPanel from './PredictionPanel';
import { useMotionPreference } from './ui/use-motion-preference';

export type TrainingStep = 'images' | 'training' | 'prediction';

const trainingFeedbackMs = 1250;

/** Only the selected panel mounts. The workspace retains classes and the fitted model. */
export default function TrainingPanels({
  workspace,
  ready,
  step,
  onSelect,
}: {
  workspace: ReturnType<typeof useTrainingWorkspace>;
  ready: boolean;
  step: TrainingStep;
  onSelect: (step: TrainingStep) => void;
}) {
  const { resources, data, cardActions } = workspace;
  const { consent, camera, prediction } = resources;
  const { classes } = data;
  const { reduce } = useMotionPreference();
  const onEnableCamera = consent.cameraConsent ? undefined : consent.requestCameraConsent;

  return (
    <div inert={!ready} className="training-panels">
      {step === 'images' && (
        <TrainingClassesPanel
          entryReady={ready}
          classes={classes.classes}
          duplicateClassNames={data.duplicateClassNames}
          stream={camera.stream}
          isCameraPending={camera.isPending}
          isCameraSwitching={camera.isSwitching}
          onEnableCamera={onEnableCamera}
          onSwitchCamera={camera.toggleCamera}
          facingMode={camera.facingMode}
          mainHeadingRef={resources.mainHeadingRef}
          cardActions={cardActions}
          onAddClass={classes.addClass}
          onContinue={() => onSelect('training')}
          canContinue={data.canTrain}
        />
      )}
      {step === 'training' && (
        <TrainingControls
          entryReady={ready}
          classes={classes.classes}
          canTrain={data.canTrain}
          hasPendingUploads={data.activity.hasUploads}
          isTraining={data.training.isTraining}
          hasTrainedModel={resources.hasTrainedModel}
          hasInvalidNames={data.training.hasInvalidNames}
          hasDuplicateNames={data.hasDuplicateNames}
          onTrain={() => data.trainModel(reduce ? 0 : trainingFeedbackMs)}
          onPredict={() => onSelect('prediction')}
        />
      )}
      {step === 'prediction' && (
        <PredictionPanel
          entryReady={ready}
          stream={camera.stream}
          classes={classes.classes}
          prediction={prediction.prediction}
          isPredicting={prediction.isPredicting}
          hasTrainedModel={resources.hasTrainedModel}
          facingMode={camera.facingMode}
          predictVideoRef={resources.predictVideoRef}
          onStartPredicting={resources.startPredicting}
          onStopPredicting={prediction.stopPredicting}
          onEnableCamera={onEnableCamera}
          cameraPending={camera.isPending}
          subscribeToFeatures={prediction.subscribeToFeatures}
        />
      )}
    </div>
  );
}
