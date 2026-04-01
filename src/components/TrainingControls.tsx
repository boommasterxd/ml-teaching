/**
 * TrainingControls.tsx
 *
 * Training section panel showing class readiness, total image count,
 * and the train/retrain button with contextual status messages.
 */
import { Brain, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import type { MLClass } from '../types/ml';
import { ML } from '../constants';

/**
 * Props for the TrainingControls component.
 */
interface TrainingControlsProps {
  /** All current ML classes with their collected images. */
  classes: MLClass[];
  /** Whether the minimum training requirements are met across all classes. */
  canTrain: boolean;
  /** Whether a training run is currently in progress. */
  isTraining: boolean;
  /** Whether a trained KNN model already exists and can be used for prediction. */
  hasTrainedModel: boolean;
  /** Whether any class has an empty or whitespace-only name. */
  hasInvalidNames: boolean;
  /** Whether two or more classes share the same name. */
  hasDuplicateNames: boolean;
  /** Callback triggered when the user clicks the train or retrain button. */
  onTrain: () => void;
}

/**
 * Renders the training control panel.
 *
 * Displays how many classes meet the minimum image threshold, the total
 * image count across all classes, and a button to start or repeat training.
 * The button is disabled when training is active or requirements are unmet.
 * A live status message below the button explains why training is blocked
 * or confirms that the model is ready.
 */
export default function TrainingControls({
  classes,
  canTrain,
  isTraining,
  hasTrainedModel,
  hasInvalidNames,
  hasDuplicateNames,
  onTrain,
}: TrainingControlsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/80 overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
        <h2 className="text-base font-bold text-zinc-800 flex items-center">
          <Brain className="w-4 h-4 mr-2 text-indigo-500" aria-hidden="true" /> 2. Training
        </h2>
        {hasTrainedModel && (
          <span role="status" className="flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
            <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" /> Bereit
          </span>
        )}
      </div>
      <div className="p-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-zinc-600">Klassen bereit:</span>
          <span className={cn('font-semibold', canTrain ? 'text-emerald-700' : 'text-red-600')}>
            {classes.filter(c => c.images.length >= ML.MIN_IMAGES_PER_CLASS).length} / {Math.max(ML.MIN_CLASSES, classes.length)}
          </span>
        </div>
        <div className="flex justify-between text-sm mb-5">
          <span className="text-zinc-600">Gesammelte Bilder:</span>
          <span className="font-semibold text-zinc-800">
            {classes.reduce((acc, c) => acc + c.images.length, 0)}
          </span>
        </div>

        <button
          onClick={onTrain}
          disabled={isTraining || !canTrain}
          aria-disabled={isTraining || !canTrain}
          className={cn(
            'w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
            isTraining || !canTrain
              ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5'
          )}
        >
          {isTraining ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> Trainiere...</>
          ) : hasTrainedModel ? (
            'Modell neu trainieren'
          ) : (
            'Modell trainieren'
          )}
        </button>

        <p className="text-xs text-zinc-600 mt-3 text-center" aria-live="polite">
          {isTraining
            ? 'Bitte warten, das Modell wird trainiert...'
            : hasInvalidNames
            ? 'Bitte gib allen Klassen einen Namen.'
            : hasDuplicateNames
            ? 'Bitte gib allen Klassen einen eindeutigen Namen.'
            : !canTrain
            ? `Sammle mind. ${ML.MIN_IMAGES_PER_CLASS} Bilder in ALLEN Klassen (mind. ${ML.MIN_CLASSES}).`
            : hasTrainedModel
            ? 'Modell ist bereit. Du kannst es jederzeit neu trainieren.'
            : 'Genug Bilder gesammelt! Du kannst das Modell jetzt trainieren.'}
        </p>
      </div>
    </div>
  );
}
