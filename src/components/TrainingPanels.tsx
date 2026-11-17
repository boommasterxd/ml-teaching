import type { useTrainingWorkspace } from '@/hooks/useTrainingWorkspace';
import TrainingClassesPanel from './TrainingClassesPanel';
import TrainingControls from './TrainingControls';
import PredictionPanel from './PredictionPanel';
import { EntryReveal } from './ui/entry-reveal';

/** Stable panel surfaces enter when the consent-gated workspace is ready, without remounting it. */
export default function TrainingPanels({
  workspace,
}: {
  workspace: ReturnType<typeof useTrainingWorkspace>;
}) {
  const { resources, data, dialogs, cardActions } = workspace;
  const { models, camera, prediction } = resources;
  const { classes } = data;
  const ready = Boolean(models.mobilenetModel) && !models.isModelLoading;
  return (
    <div
      inert={!models.mobilenetModel}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid lg:grid-cols-12 gap-8 items-start lg:gap-10"
    >
      <TrainingClassesPanel
        entryReady={ready}
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
        <EntryReveal active={ready} activation index={1}>
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
        </EntryReveal>
        <EntryReveal active={ready} activation index={2}>
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
        </EntryReveal>
      </div>
    </div>
  );
}
