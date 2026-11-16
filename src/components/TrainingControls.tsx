/**
 * TrainingControls.tsx
 *
 * Training section panel showing class readiness, total image count,
 * and the train/retrain button with contextual status messages.
 */
import { Brain, CheckCircle2, Loader2 } from './icons';
import { cn } from '../lib/utils';
import type { MLClass } from '../types/ml';
import { ML } from '../constants';
import Button from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

/**
 * Props for the TrainingControls component.
 */
interface TrainingControlsProps {
  /** All current ML classes with their collected images. */
  classes: MLClass[];
  /** Whether the minimum training requirements are met across all classes. */
  canTrain: boolean;
  hasPendingUploads: boolean;
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
  hasPendingUploads,
  isTraining,
  hasTrainedModel,
  hasInvalidNames,
  hasDuplicateNames,
  onTrain,
}: TrainingControlsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Brain aria-hidden="true" /> 2. Training
        </CardTitle>
        {hasTrainedModel && (
          <Badge variant="success" role="status">
            <CheckCircle2 data-icon="inline-start" aria-hidden="true" /> Bereit
          </Badge>
        )}
      </CardHeader>
      <Separator />
      <CardContent>
        <dl className="grid grid-cols-2 gap-5 mb-6">
          <div className="flex flex-col gap-2">
            <dt className="eyebrow">Klassen bereit</dt>
            <dd
              className={cn(
                'font-display text-3xl tracking-tight',
                canTrain ? 'text-success' : 'text-foreground',
              )}
            >
              {classes.filter((c) => c.images.length >= ML.MIN_IMAGES_PER_CLASS).length} /{' '}
              {Math.max(ML.MIN_CLASSES, classes.length)}
            </dd>
          </div>
          <div className="flex flex-col gap-2">
            <dt className="eyebrow">Gesammelte Bilder</dt>
            <dd className="font-display text-3xl tracking-tight text-foreground">
              {classes.reduce((acc, c) => acc + c.images.length, 0)}
            </dd>
          </div>
        </dl>

        <Button
          onClick={onTrain}
          variant="primary"
          disabled={isTraining || !canTrain}
          className="w-full"
        >
          {isTraining ? (
            <>
              <Loader2 data-icon="inline-start" animate loop aria-hidden="true" /> Trainiere...
            </>
          ) : hasTrainedModel ? (
            'Modell neu trainieren'
          ) : (
            'Modell trainieren'
          )}
        </Button>

        <p className="text-xs leading-relaxed text-muted-foreground mt-4" aria-live="polite">
          {isTraining
            ? 'Bitte warten, das Modell wird trainiert...'
            : hasPendingUploads
              ? 'Bitte warte, bis alle ausgewählten Bilder vollständig verarbeitet sind.'
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
      </CardContent>
    </Card>
  );
}
