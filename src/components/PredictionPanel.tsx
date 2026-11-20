import type React from 'react';
import { useEffect, useRef } from 'react';
import type { SubscribePredictionFeatures } from '@/hooks/usePredictionLoop';
import { Camera } from './icons/camera';
import { Play } from './icons/play';
import { Square } from './icons/square';
import Button from './Button';
import { cn } from '../lib/utils';
import type { MLClass, Prediction } from '../types/ml';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { EntryReveal } from './ui/entry-reveal';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from './ui/empty';
import { Progress } from './ui/progress';
import { Spinner } from './ui/spinner';
import { EmptyContent } from './ui/empty';
import { Heading, Text } from './ui/typography';
import { DeferredPredictionSpace, useDeferredPredictionSpace } from './DeferredPredictionSpace';

interface PredictionPanelProps {
  entryReady?: boolean;
  stream: MediaStream | null;
  classes: MLClass[];
  prediction: Prediction | null;
  isPredicting: boolean;
  hasTrainedModel: boolean;
  facingMode: 'user' | 'environment';
  predictVideoRef: React.RefObject<HTMLVideoElement | null>;
  onStartPredicting: () => void;
  onStopPredicting: () => void;
  onEnableCamera?: () => void;
  cameraPending: boolean;
  subscribeToFeatures: SubscribePredictionFeatures;
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
      <div role="status" className="min-w-0">
        <Text variant="muted">Erkannt</Text>
        <Heading as="h3" className="max-w-full wrap-anywhere text-foreground">
          {predictedClassName}
        </Heading>
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
  onStartPredicting,
  onStopPredicting,
  onStartIntent,
}: Pick<PredictionPanelProps, 'isPredicting' | 'onStartPredicting' | 'onStopPredicting'> & {
  onStartIntent: () => void;
}) {
  const Icon = isPredicting ? Square : Play;
  const prepare = isPredicting ? undefined : onStartIntent;
  return (
    <Button
      variant="outline"
      onClick={isPredicting ? onStopPredicting : onStartPredicting}
      onPointerEnter={prepare}
      onPointerDown={prepare}
      onFocus={prepare}
      className="min-h-11"
      aria-label={isPredicting ? 'Live-Vorhersage stoppen' : 'Live-Vorhersage starten'}
    >
      <Icon data-icon="inline-start" className="fill-current" aria-hidden="true" />
      {isPredicting ? 'Stoppen' : 'Starten'}
    </Button>
  );
}

function CameraPreview({
  facingMode,
  predictVideoRef,
  stream,
  stretch,
}: Pick<PredictionPanelProps, 'facingMode' | 'predictVideoRef' | 'stream'> & {
  stretch: boolean;
}) {
  useEffect(() => {
    const video = predictVideoRef.current;
    if (!video) return;
    video.srcObject = stream;
    return () => {
      video.srcObject = null;
    };
  }, [predictVideoRef, stream]);
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-media-surface',
        stretch ? 'self-stretch' : 'aspect-[16/10]',
      )}
    >
      <video
        ref={predictVideoRef}
        autoPlay
        playsInline
        muted
        aria-label="Kameravorschau für Vorhersage"
        className={cn(
          'absolute inset-0 size-full object-cover',
          facingMode === 'user' && 'transform scale-x-[-1]',
        )}
      />
    </div>
  );
}

function PredictionPlaceholder({
  description,
  children,
}: {
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Empty className="min-h-36 border border-border bg-muted/60 px-4 py-5 md:p-5">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="mb-0">
          <Camera aria-hidden="true" />
        </EmptyMedia>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children}
    </Empty>
  );
}

function predictionDescription({
  hasTrainedModel,
  stream,
  onEnableCamera,
  cameraPending,
}: Pick<PredictionPanelProps, 'hasTrainedModel' | 'stream' | 'onEnableCamera' | 'cameraPending'>) {
  if (!hasTrainedModel) return 'Trainiere zuerst dein Modell, um neue Kamerabilder zuzuordnen.';
  if (stream) return 'Starte die Live-Vorhersage, um dein Modell auszuprobieren.';
  if (cameraPending) return 'Kamera wird verbunden.';
  if (onEnableCamera) return 'Aktiviere die Kamera für die Live-Vorhersage.';
  return 'Für die Live-Vorhersage wird eine Kamera benötigt.';
}

export default function PredictionPanel({
  entryReady,
  classes,
  prediction,
  isPredicting,
  hasTrainedModel,
  stream,
  facingMode,
  predictVideoRef,
  onStartPredicting,
  onStopPredicting,
  onEnableCamera,
  cameraPending,
  subscribeToFeatures,
}: PredictionPanelProps) {
  const active = hasTrainedModel && isPredicting;
  const canControl = hasTrainedModel && (active || Boolean(stream));
  const area = useRef<HTMLDivElement>(null);
  const space = useDeferredPredictionSpace(area, classes, canControl, active && Boolean(stream));
  const stretchPreview = space.visible && Boolean(space.result && 'module' in space.result);
  return (
    <EntryReveal asChild kind="reading" active={entryReady} scrollOnly index={1}>
      <section aria-labelledby="training-prediction">
        <Card className="@container/prediction gap-4">
          <CardHeader className="grid-rows-[minmax(2.75rem,auto)] items-center">
            <CardTitle
              id="training-prediction"
              tabIndex={-1}
              className="workspace-heading scroll-mt-28"
            >
              Vorhersage
            </CardTitle>
            {canControl && (
              <CardAction className="self-center">
                <PredictionAction
                  isPredicting={isPredicting}
                  onStartPredicting={onStartPredicting}
                  onStopPredicting={onStopPredicting}
                  onStartIntent={space.prepare}
                />
              </CardAction>
            )}
          </CardHeader>
          <CardContent
            ref={area}
            className="flex flex-1 flex-col @2xl/prediction:[--prediction-space:1]"
          >
            {active ? (
              <div className="grid items-start gap-4 @lg/prediction:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
                <CameraPreview
                  facingMode={facingMode}
                  predictVideoRef={predictVideoRef}
                  stream={stream}
                  stretch={stretchPreview}
                />
                <div className="grid min-w-0 gap-3">
                  <Badge variant="secondary">
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                    {stream ? 'Live' : 'Kamera wird verbunden'}
                  </Badge>
                  <ConfidenceResults classes={classes} prediction={stream ? prediction : null} />
                  {space.visible && (
                    <DeferredPredictionSpace
                      result={space.result}
                      classes={classes}
                      subscribeToFeatures={subscribeToFeatures}
                    />
                  )}
                </div>
              </div>
            ) : (
              <PredictionPlaceholder
                description={predictionDescription({
                  hasTrainedModel,
                  stream,
                  onEnableCamera,
                  cameraPending,
                })}
              >
                {hasTrainedModel && !stream && (cameraPending || onEnableCamera) && (
                  <EmptyContent>
                    {cameraPending ? (
                      <Spinner aria-hidden="true" />
                    ) : (
                      <Button variant="outline" onClick={onEnableCamera}>
                        Kamera aktivieren
                      </Button>
                    )}
                  </EmptyContent>
                )}
              </PredictionPlaceholder>
            )}
          </CardContent>
        </Card>
      </section>
    </EntryReveal>
  );
}
