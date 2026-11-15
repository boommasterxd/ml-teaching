import type React from 'react';
import * as Progress from '@animate-ui/react/primitives/radix-ui/progress';
import { Camera, Play, Square } from './icons';
import Button from './Button';
import { cn } from '../lib/utils';
import type { MLClass, Prediction } from '../types/ml';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

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
  onStopPredicting,
}: Pick<PredictionPanelProps, 'classes' | 'prediction' | 'onStopPredicting'>) {
  if (!prediction)
    return <p className="text-foreground text-sm text-center">Die Vorhersage wird vorbereitet.</p>;
  const predictedClassName =
    classes.find((cls) => cls.id === prediction.label)?.name ?? 'Unbekannt';
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center mb-2" role="status" aria-live="polite">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">
          Erkannt
        </div>
        <div className="text-2xl font-black text-foreground">{predictedClassName}</div>
      </div>
      <div className="flex flex-col gap-2.5">
        {classes.map((cls) => {
          const confidence = prediction.confidences[cls.id] ?? 0;
          const percentage = Number.isFinite(confidence)
            ? Math.round(Math.max(0, Math.min(1, confidence)) * 100)
            : 0;
          return (
            <div key={cls.id} className="flex items-center text-xs">
              <span className="w-20 truncate font-semibold text-muted-foreground">{cls.name}</span>
              <Progress.Root
                value={percentage}
                aria-label={`Konfidenz für ${cls.name}`}
                className="flex-1 h-2 bg-muted rounded-full overflow-hidden mx-3"
              >
                <Progress.Indicator
                  className="h-full w-full rounded-full"
                  style={{
                    backgroundColor: cls.color,
                    transform: `translateX(-${100 - percentage}%)`,
                  }}
                />
              </Progress.Root>
              <span className="w-10 text-right font-mono font-medium text-muted-foreground">
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>
      <Button variant="secondary" onClick={onStopPredicting} className="w-full mt-4">
        <Square data-icon="inline-start" className="fill-current" aria-hidden="true" /> Stoppen
      </Button>
    </div>
  );
}

/** Local prediction results; frequent confidence updates do not announce every percentage. */
export default function PredictionPanel(props: PredictionPanelProps) {
  const {
    classes,
    prediction,
    isPredicting,
    hasTrainedModel,
    hasCamera,
    facingMode,
    predictVideoRef,
    onStartPredicting,
    onStopPredicting,
  } = props;
  return (
    <Card
      className={cn('flex-1', !hasTrainedModel && 'opacity-80 pointer-events-none')}
      inert={!hasTrainedModel}
    >
      <CardHeader>
        <CardTitle>
          <Camera aria-hidden="true" /> 3. Vorhersage
        </CardTitle>
        {isPredicting && (
          <Badge variant="success">
            <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
            Live
          </Badge>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="flex flex-col flex-1">
        <div className="relative aspect-[16/10.25] bg-zinc-900 rounded-xl overflow-hidden mb-5 flex-shrink-0">
          <video
            ref={predictVideoRef}
            autoPlay
            playsInline
            muted
            aria-label="Kameravorschau für Vorhersage"
            className={cn(
              'w-full h-full object-cover rounded-xl',
              facingMode === 'user' && 'transform scale-x-[-1]',
            )}
          />
          {!isPredicting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
              <Button
                variant="prediction"
                onClick={onStartPredicting}
                disabled={!hasCamera}
                aria-describedby={!hasCamera ? 'prediction-camera-hint' : undefined}
              >
                <Play data-icon="inline-start" className="fill-current" aria-hidden="true" />{' '}
                Starten
              </Button>
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center min-h-[2.25rem]">
          {isPredicting ? (
            <ConfidenceResults
              classes={classes}
              prediction={prediction}
              onStopPredicting={onStopPredicting}
            />
          ) : (
            <div
              id="prediction-camera-hint"
              className="h-full flex items-center justify-center text-foreground text-sm text-center"
            >
              {hasCamera
                ? 'Starte die Vorhersage, um Ergebnisse zu sehen.'
                : 'Aktiviere die Kamera, um die Live-Vorhersage zu starten.'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
