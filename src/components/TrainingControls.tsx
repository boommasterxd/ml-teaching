import { Brain } from './icons/brain';
import { ArrowRight } from './icons/arrow-right';
import type { TrainingProgress } from '../hooks/useModelTraining';
import type { MLClass } from '../types/ml';
import { ML } from '../constants';
import Button from './Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { EntryReveal } from './ui/entry-reveal';
import { Spinner } from './ui/spinner';
import { MessageSlot } from './ui/message-slot';
import { Progress } from './ui/progress';
import { Text } from './ui/typography';
import TrainingFigure from './TrainingFigure';

interface TrainingControlsProps {
  entryReady?: boolean;
  classes: MLClass[];
  canTrain: boolean;
  hasPendingUploads: boolean;
  progress: TrainingProgress | null;
  hasTrainedModel: boolean;
  hasInvalidNames: boolean;
  hasDuplicateNames: boolean;
  onTrain: () => void;
  onPredict?: () => void;
  onPredictIntent?: () => void;
}

const statusMessages = {
  preparing: 'Das Modell wird vorbereitet.',
  training: 'Das Modell ordnet die Bildmerkmale deinen Klassen zu.',
  uploading: 'Bitte warte, bis alle ausgewählten Bilder vollständig verarbeitet sind.',
  emptyNames: 'Bitte gib allen Klassen einen Namen.',
  duplicateNames: 'Bitte gib allen Klassen einen eindeutigen Namen.',
  missingImages: `Du brauchst mindestens ${ML.MIN_CLASSES} Klassen und mindestens ${ML.MIN_IMAGES_PER_CLASS} Bilder pro Klasse.`,
  trained: 'Du kannst jetzt neue Kamerabilder zuordnen.',
  ready: 'Bereit zum Trainieren.',
};
const trainingStatusMessages = Object.values(statusMessages);

function trainingStatus(props: TrainingControlsProps) {
  if (props.progress) {
    return props.progress.processed === 0 ? statusMessages.preparing : statusMessages.training;
  }
  if (props.hasPendingUploads) return statusMessages.uploading;
  if (props.hasInvalidNames) return statusMessages.emptyNames;
  if (props.hasDuplicateNames) return statusMessages.duplicateNames;
  if (!props.canTrain) return statusMessages.missingImages;
  return statusMessages.ready;
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

function TrainingProgressIndicator({ progress }: Pick<TrainingControlsProps, 'progress'>) {
  const count = progress ? `${progress.processed} von ${progress.total} Bildern verarbeitet` : '';
  return (
    <div className="grid min-h-8 w-full max-w-xs gap-1">
      {progress && (
        <>
          <Progress
            value={progress.processed}
            max={progress.total}
            aria-label="Trainingsfortschritt"
            aria-valuetext={count}
          />
          <Text variant="muted" className="text-xs tabular-nums" aria-hidden="true">
            {count}
          </Text>
        </>
      )}
    </div>
  );
}

export default function TrainingControls(props: TrainingControlsProps) {
  const { classes, canTrain, progress, hasTrainedModel, onTrain, onPredict } = props;
  const isTraining = progress !== null;
  const state = progress ? 'training' : hasTrainedModel ? 'complete' : 'idle';
  const complete = state === 'complete';
  const title = {
    idle: 'Trainingsdaten',
    training: 'Training läuft',
    complete: 'Training abgeschlossen',
  }[state];
  return (
    <EntryReveal asChild kind="reading" active={props.entryReady} scrollOnly>
      <section aria-labelledby="training-model">
        <Card className="gap-4">
          <CardHeader>
            <CardTitle id="training-model" tabIndex={-1} className="workspace-heading scroll-mt-28">
              Training
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <TrainingSummary classes={classes} />
            <div className="training-feedback" data-complete={complete || undefined}>
              <TrainingFigure
                state={state}
                progress={progress ? progress.processed / progress.total : 0}
              />
              <div role="status" id="training-status" className="grid min-w-0">
                <strong className="text-xl font-semibold">{title}</strong>
                <Text variant="muted" className="leading-relaxed">
                  <MessageSlot messages={trainingStatusMessages}>
                    {complete ? statusMessages.trained : trainingStatus(props)}
                  </MessageSlot>
                </Text>
              </div>
              <TrainingProgressIndicator progress={progress} />
            </div>
          </CardContent>
          <CardFooter className="flex-wrap gap-2">
            <Button
              onClick={() => {
                if (canTrain && !isTraining) onTrain();
              }}
              variant={complete ? 'outline' : 'default'}
              size="lg"
              disabled={!isTraining && !canTrain}
              aria-disabled={isTraining || !canTrain}
              className="w-full aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-disabled:focus-visible:opacity-100 sm:w-auto"
              aria-describedby={complete ? undefined : 'training-status'}
            >
              {progress ? (
                <>
                  <Spinner data-icon="inline-start" aria-hidden="true" /> Trainiere …
                </>
              ) : (
                <>
                  <Brain data-icon="inline-start" aria-hidden="true" />
                  {hasTrainedModel ? 'Modell neu trainieren' : 'Modell trainieren'}
                </>
              )}
            </Button>
            {complete && onPredict && (
              <Button
                onClick={onPredict}
                onPointerEnter={props.onPredictIntent}
                onFocus={props.onPredictIntent}
                onPointerDown={props.onPredictIntent}
                size="lg"
                className="w-full sm:w-auto"
              >
                Weiter zur Vorhersage
                <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </section>
    </EntryReveal>
  );
}
