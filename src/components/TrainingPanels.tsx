import { Activity, useMemo } from 'react';
import type { useTrainingWorkspace } from '@/hooks/useTrainingWorkspace';
import type { CameraView } from './CameraControls';
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
  const { camera, prediction, revokeCamera } = resources;
  const { classes } = data;
  const { stream, facingMode, active, isPending, hasFailed, start, toggleCamera } = camera;
  const cameraView = useMemo<CameraView>(
    () => ({
      stream,
      facingMode,
      active,
      pending: isPending,
      failed: hasFailed,
      onToggle: active ? revokeCamera : start,
      onSwitch: toggleCamera,
    }),
    [stream, facingMode, active, isPending, hasFailed, revokeCamera, start, toggleCamera],
  );
  const { training: TrainingControls, prediction: PredictionPanel } = modules;

  return (
    <div inert={!ready} className="training-panels">
      {step === 'images' && (
        <TrainingClassesPanel
          entryReady={ready}
          classes={classes.classes}
          duplicateClassNames={data.duplicateClassNames}
          camera={cameraView}
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
            camera={cameraView}
            classes={classes.classes}
            prediction={prediction.prediction}
            isPredicting={step === 'prediction' && prediction.isPredicting}
            hasTrainedModel={resources.hasTrainedModel}
            predictVideoRef={resources.predictVideoRef}
            subscribeToFeatures={prediction.subscribeToFeatures}
          />
        </Activity>
      )}
    </div>
  );
}
