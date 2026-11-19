import type React from 'react';
import { Camera } from './icons/camera';
import { Play } from './icons/play';
import { Square } from './icons/square';
import Button from './Button';
import { cn } from '../lib/utils';
import type { MLClass, Prediction } from '../types/ml';
import { CardAction, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Heading, Text } from './ui/typography';

interface PredictionPanelProps {
  hasCamera: boolean;
  classes: MLClass[];
  prediction: Prediction | null;
  isPredicting: boolean;
  hasTrainedModel: boolean;
  facingMode: 'user' | 'environment';
  predictVideoRef: React.RefObject<HTMLVideoElement | null>;
  onStartPredicting: () => void;
  onStopPredicting: () => void;
}

function ConfidenceResults({
  classes,
  prediction,
}: Pick<PredictionPanelProps, 'classes' | 'prediction'>) {
  if (!prediction)
    return (
      <Text variant="muted" className="text-center">
        Die Vorhersage wird vorbereitet.
      </Text>
    );
  const predictedClassName =
    classes.find((cls) => cls.id === prediction.label)?.name ?? 'Unbekannt';
  return (
    <div className="flex flex-col gap-4">
      <Alert role="status" className="border-0 bg-transparent p-0">
        <AlertDescription className="min-w-0">
          <Text variant="muted">Erkannt</Text>
          <Heading as="h3" className="max-w-full break-words text-foreground">
            {predictedClassName}
          </Heading>
        </AlertDescription>
      </Alert>
      <div className="flex flex-col gap-2.5">
        {classes.map((cls) => {
          const confidence = prediction.confidences[cls.id] ?? 0;
          const percentage = Number.isFinite(confidence)
            ? Math.round(Math.max(0, Math.min(1, confidence)) * 100)
            : 0;
          return (
            <div key={cls.id} className="flex items-center text-xs">
              <span className="w-20 truncate font-semibold text-muted-foreground">{cls.name}</span>
              <Progress
                value={percentage}
                aria-label={`Konfidenz für ${cls.name}`}
                className="mx-3 flex-1"
              />
              <span className="w-10 text-right font-mono font-medium text-muted-foreground">
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PredictionAction({
  isPredicting,
  hasTrainedModel,
  hasCamera,
  onStartPredicting,
  onStopPredicting,
}: PredictionPanelProps) {
  const disabled = !isPredicting && (!hasTrainedModel || !hasCamera);
  const Icon = isPredicting ? Square : Play;
  return (
    <Button
      variant={isPredicting ? 'secondary' : 'outline'}
      onClick={isPredicting ? onStopPredicting : onStartPredicting}
      disabled={disabled}
      aria-describedby={disabled ? 'prediction-camera-hint' : undefined}
      className="min-h-11 w-full sm:w-auto"
    >
      <Icon data-icon="inline-start" className="fill-current" aria-hidden="true" />
      {isPredicting ? 'Stoppen' : 'Starten'}
    </Button>
  );
}

function CameraPreview({
  facingMode,
  predictVideoRef,
}: Pick<PredictionPanelProps, 'facingMode' | 'predictVideoRef'>) {
  return (
    <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-media-surface">
      <video
        ref={predictVideoRef}
        autoPlay
        playsInline
        muted
        aria-label="Kameravorschau für Vorhersage"
        className={cn(
          'w-full h-full object-cover',
          facingMode === 'user' && 'transform scale-x-[-1]',
        )}
      />
    </div>
  );
}

export default function PredictionPanel(props: PredictionPanelProps) {
  const { classes, prediction, isPredicting, hasTrainedModel, hasCamera } = props;
  const showVideo = hasTrainedModel && hasCamera;
  return (
    <section className="training-stage" aria-labelledby="training-prediction">
      <CardHeader className="items-center">
        <CardTitle id="training-prediction" tabIndex={-1} className="workspace-heading">
          Vorhersage
        </CardTitle>
        <CardAction className="flex items-center gap-2 text-muted-foreground">
          {isPredicting ? (
            <Badge variant="secondary">
              <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
              Live
            </Badge>
          ) : (
            <Camera className="size-5" aria-hidden="true" />
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        {showVideo && (
          <CameraPreview facingMode={props.facingMode} predictVideoRef={props.predictVideoRef} />
        )}
        {isPredicting && <ConfidenceResults classes={classes} prediction={prediction} />}
        {!isPredicting && !showVideo && (
          <Text id="prediction-camera-hint" variant="muted" className="leading-relaxed">
            {hasTrainedModel ? (
              <>
                <a href="#training-camera" className="font-medium underline underline-offset-4">
                  Aktiviere die Kamera
                </a>
                , um die Live-Vorhersage zu starten.
              </>
            ) : (
              'Trainiere zuerst dein Modell, um neue Kamerabilder zuzuordnen.'
            )}
          </Text>
        )}
      </CardContent>
      <CardFooter>
        <PredictionAction {...props} />
      </CardFooter>
    </section>
  );
}
