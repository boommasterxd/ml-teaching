import type React from 'react';
import { useEffect, useMemo } from 'react';
import type { SubscribePredictionFeatures } from '@/hooks/usePredictionLoop';
import { Camera } from './icons/camera';
import { Play } from './icons/play';
import { Square } from './icons/square';
import Button from './Button';
import { cn } from '../lib/utils';
import type { MLClass, Prediction } from '../types/ml';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { EntryReveal } from './ui/entry-reveal';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from './ui/empty';
import { Progress } from './ui/progress';
import { Spinner } from './ui/spinner';
import { MessageSlot } from './ui/message-slot';
import { Heading, Text } from './ui/typography';
import { DeferredPredictionSpace, useDeferredPredictionSpace } from './DeferredPredictionSpace';
import PredictionDiagram from './PredictionDiagram';

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
  cameraAllowed?: boolean;
  cameraPending: boolean;
  cameraFailed?: boolean;
  subscribeToFeatures: SubscribePredictionFeatures;
}

const pendingPrediction = 'Die Vorhersage wird vorbereitet.';
const unknownClass = 'Unbekannt';

function ConfidenceResults({
  classes,
  prediction,
  isPredicting,
}: Pick<PredictionPanelProps, 'classes' | 'prediction' | 'isPredicting'>) {
  const resultNames = useMemo(
    () => [...new Set([pendingPrediction, unknownClass, ...classes.map(({ name }) => name)])],
    [classes],
  );
  const result = prediction
    ? (classes.find((cls) => cls.id === prediction.label)?.name ?? unknownClass)
    : isPredicting
      ? pendingPrediction
      : '—';
  return (
    <div className="flex flex-col gap-4">
      <div role="status" className="min-w-0">
        <Text variant="muted">Ergebnis</Text>
        <Heading as="h3" className="max-w-full text-lg wrap-anywhere text-foreground">
          <MessageSlot messages={resultNames}>{result}</MessageSlot>
        </Heading>
      </div>
      <div className="flex flex-col gap-2.5" aria-hidden={!prediction || undefined}>
        {classes.map((cls) => {
          const confidence = prediction?.confidences[cls.id] ?? 0;
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
              <span className="w-10 text-right font-mono font-medium text-muted-foreground tabular-nums">
                {prediction ? `${percentage}%` : '—'}
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
  pending,
}: Pick<PredictionPanelProps, 'isPredicting' | 'onStartPredicting' | 'onStopPredicting'> & {
  onStartIntent: () => void;
  pending: boolean;
}) {
  const Icon = isPredicting ? Square : Play;
  const prepare = isPredicting || pending ? undefined : onStartIntent;
  return (
    <Button
      variant={isPredicting ? 'secondary' : 'default'}
      onClick={pending ? undefined : isPredicting ? onStopPredicting : onStartPredicting}
      aria-disabled={pending || undefined}
      onPointerEnter={prepare}
      onPointerDown={prepare}
      onFocus={prepare}
      className="min-h-11 min-w-28 shadow-sm"
      aria-label={isPredicting ? 'Live-Vorhersage stoppen' : 'Live-Vorhersage starten'}
    >
      <Icon data-icon="inline-start" className="fill-current" aria-hidden="true" />
      {isPredicting ? 'Stoppen' : 'Starten'}
    </Button>
  );
}

function CameraFeed({
  facingMode,
  predictVideoRef,
  stream,
}: Pick<PredictionPanelProps, 'facingMode' | 'predictVideoRef' | 'stream'>) {
  useEffect(() => {
    const video = predictVideoRef.current;
    if (!video) return;
    video.srcObject = stream;
    return () => {
      video.srcObject = null;
    };
  }, [predictVideoRef, stream]);
  return (
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
  );
}

function PredictionPlaceholder({
  description,
  className,
  pending,
  compact,
}: {
  description: string;
  className?: string;
  pending?: boolean;
  compact?: boolean;
}) {
  return (
    <Empty className={cn('min-h-36 border border-border bg-muted/60 px-4 py-5 md:p-5', className)}>
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className={cn(
            'mb-0',
            compact && 'size-7 [&_svg]:size-4 @lg/prediction:size-10 @lg/prediction:[&_svg]:size-6',
          )}
        >
          {pending ? <Spinner aria-hidden="true" /> : <Camera aria-hidden="true" />}
        </EmptyMedia>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function cameraDescription({
  stream,
  onEnableCamera,
  cameraPending,
  cameraFailed,
  cameraAllowed,
}: Pick<
  PredictionPanelProps,
  'stream' | 'onEnableCamera' | 'cameraAllowed' | 'cameraPending' | 'cameraFailed'
>) {
  if (stream) return 'Die Kamera ist bereit.';
  if (cameraPending) return 'Kamera wird verbunden.';
  if (cameraFailed) return 'Die Kameraverbindung ist unterbrochen.';
  if (onEnableCamera) return 'Aktiviere die Kamera für die Vorhersage.';
  if (cameraAllowed) return 'Die Kamera startet mit der Live-Vorhersage.';
  return 'Für die Live-Vorhersage wird eine Kamera benötigt.';
}

type CameraProps = Omit<
  PredictionPanelProps,
  'entryReady' | 'hasTrainedModel' | 'classes' | 'prediction' | 'subscribeToFeatures'
>;

function PredictionCamera({
  isPredicting,
  stream,
  facingMode,
  predictVideoRef,
  onStartPredicting,
  onStopPredicting,
  onEnableCamera,
  cameraAllowed = Boolean(stream),
  cameraPending,
  cameraFailed,
  onStartIntent,
}: CameraProps & { onStartIntent: () => void }) {
  const playable = cameraAllowed;
  const canEnable = Boolean(onEnableCamera && !cameraPending);
  return (
    <div
      data-slot="prediction-camera"
      className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-media-surface @lg/prediction:aspect-auto @lg/prediction:self-stretch"
    >
      {isPredicting && stream ? (
        <CameraFeed facingMode={facingMode} predictVideoRef={predictVideoRef} stream={stream} />
      ) : (
        <PredictionPlaceholder
          description={cameraDescription({
            stream,
            onEnableCamera,
            cameraAllowed,
            cameraPending,
            cameraFailed,
          })}
          pending={cameraPending}
          compact
          className={cn(
            'absolute inset-0 min-h-0 border-0 bg-transparent p-3 md:p-3',
            (playable || canEnable) && 'pt-14 md:pt-14',
          )}
        />
      )}
      <div className="absolute inset-x-2 top-2 flex justify-end">
        {playable ? (
          <PredictionAction
            isPredicting={isPredicting}
            onStartPredicting={onStartPredicting}
            onStopPredicting={onStopPredicting}
            onStartIntent={onStartIntent}
            pending={cameraPending}
          />
        ) : canEnable ? (
          <Button variant="outline" className="min-h-11" onClick={onEnableCamera}>
            Kamera aktivieren
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function PredictionWorkspace({
  classes,
  prediction,
  subscribeToFeatures,
  ...camera
}: Omit<PredictionPanelProps, 'entryReady' | 'hasTrainedModel'>) {
  const { isPredicting, stream } = camera;
  const live = isPredicting && Boolean(stream);
  const space = useDeferredPredictionSpace(classes, camera.cameraAllowed ?? Boolean(stream), live);
  return (
    <div className="grid items-start gap-4 @lg/prediction:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <PredictionCamera {...camera} onStartIntent={space.prepare} />
      <div className="grid min-w-0 gap-3">
        <Badge variant="secondary">
          <span
            className={cn('size-1.5 rounded-full', live ? 'bg-primary' : 'bg-muted-foreground')}
            aria-hidden="true"
          />
          {live ? 'Live' : 'Inaktiv'}
        </Badge>
        <ConfidenceResults
          classes={classes}
          prediction={live ? prediction : null}
          isPredicting={isPredicting}
        />
        <PredictionDiagram classes={classes}>
          {space.visible && (
            <DeferredPredictionSpace
              result={space.result}
              classes={classes}
              subscribeToFeatures={subscribeToFeatures}
            />
          )}
        </PredictionDiagram>
      </div>
    </div>
  );
}

export default function PredictionPanel({
  entryReady,
  hasTrainedModel,
  ...workspace
}: PredictionPanelProps) {
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
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            {hasTrainedModel ? (
              <PredictionWorkspace {...workspace} />
            ) : (
              <PredictionPlaceholder description="Trainiere zuerst dein Modell, um neue Kamerabilder zuzuordnen." />
            )}
          </CardContent>
        </Card>
      </section>
    </EntryReveal>
  );
}
