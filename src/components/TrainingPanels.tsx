import { Activity } from 'react';
import type { useTrainingWorkspace } from '@/hooks/useTrainingWorkspace';
import TrainingClassesPanel from './TrainingClassesPanel';
import type { TrainingPanelModules, TrainingStep } from './training-panel-loading';

/** Only the selected panel runs effects. Prepare a single inactive panel after intent. */
export default function TrainingPanels({
  workspace,
  ready,
  step,
  modules,
  prepared,
  onSelect,
  onPrepare,
}: {
  workspace: ReturnType<typeof useTrainingWorkspace>;
  ready: boolean;
  step: TrainingStep;
  modules: TrainingPanelModules;
  prepared: TrainingStep | null;
  onSelect: (step: TrainingStep) => void;
  onPrepare: (step: TrainingStep) => void;
}) {
  const { resources, data, cardActions } = workspace;
  const { consent, camera, prediction } = resources;
  const { classes } = data;
  const onEnableCamera = camera.hasFailed
    ? camera.retryCamera
    : consent.cameraConsent
      ? undefined
      : consent.requestCameraConsent;
  const { training: TrainingControls, prediction: PredictionPanel } = modules;

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
          cameraFailed={camera.hasFailed}
          onEnableCamera={onEnableCamera}
          onSwitchCamera={camera.toggleCamera}
          facingMode={camera.facingMode}
          mainHeadingRef={resources.mainHeadingRef}
          cardActions={cardActions}
          onAddClass={classes.addClass}
          onContinue={() => onSelect('training')}
          onContinueIntent={() => onPrepare('training')}
          canContinue={data.canTrain}
        />
      )}
      {TrainingControls && (step === 'training' || prepared === 'training') && (
        <Activity mode={step === 'training' ? 'visible' : 'hidden'}>
          <TrainingControls
            entryReady={ready && step === 'training'}
            classes={classes.classes}
            canTrain={data.canTrain}
            hasPendingUploads={data.activity.hasUploads}
            progress={data.training.progress}
            hasTrainedModel={resources.hasTrainedModel}
            hasInvalidNames={data.training.hasInvalidNames}
            hasDuplicateNames={data.hasDuplicateNames}
            onTrain={data.trainModel}
            onPredict={() => onSelect('prediction')}
            onPredictIntent={() => onPrepare('prediction')}
          />
        </Activity>
      )}
      {PredictionPanel && (step === 'prediction' || prepared === 'prediction') && (
        <Activity mode={step === 'prediction' ? 'visible' : 'hidden'}>
          <PredictionPanel
            entryReady={ready && step === 'prediction'}
            stream={camera.stream}
            classes={classes.classes}
            prediction={prediction.prediction}
            isPredicting={step === 'prediction' && prediction.isPredicting}
            hasTrainedModel={resources.hasTrainedModel}
            facingMode={camera.facingMode}
            predictVideoRef={resources.predictVideoRef}
            onStartPredicting={resources.startPredicting}
            onStopPredicting={prediction.stopPredicting}
            onEnableCamera={onEnableCamera}
            cameraPending={camera.isPending}
            cameraFailed={camera.hasFailed}
            subscribeToFeatures={prediction.subscribeToFeatures}
          />
        </Activity>
      )}
    </div>
  );
}
