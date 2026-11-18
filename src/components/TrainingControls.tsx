import { Brain } from './icons/brain';
import { CheckCircle2 } from './icons/check-circle2';
import { Loader2 } from './icons/loader2';
import type { MLClass } from '../types/ml';
import { ML } from '../constants';
import Button from './Button';
import { CardAction, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Text } from './ui/typography';

interface TrainingControlsProps {
  classes: MLClass[];
  canTrain: boolean;
  hasPendingUploads: boolean;
  isTraining: boolean;
  hasTrainedModel: boolean;
  hasInvalidNames: boolean;
  hasDuplicateNames: boolean;
  onTrain: () => void;
}

function trainingStatus(props: TrainingControlsProps) {
  if (props.isTraining) return 'Bitte warten, das Modell wird trainiert...';
  if (props.hasPendingUploads)
    return 'Bitte warte, bis alle ausgewählten Bilder vollständig verarbeitet sind.';
  if (props.hasInvalidNames) return 'Bitte gib allen Klassen einen Namen.';
  if (props.hasDuplicateNames) return 'Bitte gib allen Klassen einen eindeutigen Namen.';
  if (!props.canTrain)
    return `Du brauchst mindestens ${ML.MIN_CLASSES} Klassen und mindestens ${ML.MIN_IMAGES_PER_CLASS} Bilder pro Klasse.`;
  return props.hasTrainedModel ? 'Modell bereit.' : 'Bereit zum Trainieren.';
}

function TrainingSummary({ classes }: Pick<TrainingControlsProps, 'classes'>) {
  const ready = classes.filter((item) => item.images.length >= ML.MIN_IMAGES_PER_CLASS).length;
  const images = classes.reduce((count, item) => count + item.images.length, 0);
  return (
    <dl className="flex flex-wrap gap-x-9 gap-y-3 py-1">
      <div className="grid gap-1">
        <dt className="text-sm text-muted-foreground">Klassen bereit</dt>
        <dd className="text-2xl font-semibold tracking-tight tabular-nums">
          {ready}{' '}
          <span className="text-base font-normal text-muted-foreground">
            / {Math.max(classes.length, ML.MIN_CLASSES)}
          </span>
        </dd>
      </div>
      <div className="grid gap-1">
        <dt className="text-sm text-muted-foreground">Gesammelte Bilder</dt>
        <dd className="text-2xl font-semibold tracking-tight tabular-nums">{images}</dd>
      </div>
    </dl>
  );
}

export default function TrainingControls(props: TrainingControlsProps) {
  const { classes, canTrain, isTraining, hasTrainedModel, onTrain } = props;
  return (
    <section className="training-stage" aria-labelledby="training-model">
      <CardHeader className="items-center">
        <CardTitle id="training-model" tabIndex={-1} className="workspace-heading">
          Training
        </CardTitle>
        {hasTrainedModel && !isTraining && (
          <CardAction>
            <Badge variant="secondary" role="status">
              <CheckCircle2 data-icon="inline-start" aria-hidden="true" /> Bereit
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="grid gap-3">
        <TrainingSummary classes={classes} />
        <Text variant="muted" className="leading-relaxed" id="training-status" aria-live="polite">
          {trainingStatus(props)}
        </Text>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onTrain}
          size="lg"
          disabled={isTraining || !canTrain}
          className="w-full sm:w-auto"
          aria-describedby="training-status"
        >
          {isTraining ? (
            <>
              <Loader2 data-icon="inline-start" animate loop aria-hidden="true" /> Trainiere...
            </>
          ) : (
            <>
              <Brain data-icon="inline-start" aria-hidden="true" />{' '}
              {hasTrainedModel ? 'Modell neu trainieren' : 'Modell trainieren'}
            </>
          )}
        </Button>
      </CardFooter>
    </section>
  );
}
