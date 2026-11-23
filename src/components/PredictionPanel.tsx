import type React from 'react';
import { useEffect, useMemo } from 'react';
import type { SubscribePredictionFeatures } from '@/hooks/usePredictionLoop';
import { Camera } from './icons/camera';
import CameraControls, { type CameraView } from './CameraControls';
import { cn } from '../lib/utils';
import type { MLClass, Prediction } from '../types/ml';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { EntryReveal } from './ui/entry-reveal';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from './ui/empty';
import { Progress } from './ui/progress';
import { MessageSlot } from './ui/message-slot';
import { Heading, Text } from './ui/typography';
import { DeferredPredictionSpace, useDeferredPredictionSpace } from './DeferredPredictionSpace';
import PredictionDiagram from './PredictionDiagram';

interface PredictionPanelProps {
  entryReady?: boolean;
  camera: CameraView;
  classes: MLClass[];
  prediction: Prediction | null;
  isPredicting: boolean;
  hasTrainedModel: boolean;
  predictVideoRef: React.RefObject<HTMLVideoElement | null>;
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

function CameraFeed({
  camera,
  predictVideoRef,
}: Pick<PredictionPanelProps, 'camera' | 'predictVideoRef'>) {
  const { stream, facingMode } = camera;
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

function UntrainedPrediction() {
  return (
    <Empty className="min-h-36 border border-border bg-muted/60 px-4 py-5 md:p-5">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="mb-0">
          <Camera aria-hidden="true" />
        </EmptyMedia>
        <EmptyDescription>
          Trainiere zuerst dein Modell, um neue Kamerabilder zuzuordnen.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function PredictionCamera({
  isPredicting,
  camera,
  predictVideoRef,
  onStartIntent,
}: Pick<PredictionPanelProps, 'isPredicting' | 'camera' | 'predictVideoRef'> & {
  onStartIntent: () => void;
}) {
  return (
    <div
      data-slot="prediction-camera"
      className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-media-surface @lg/prediction:aspect-auto @lg/prediction:self-stretch"
    >
      {isPredicting && camera.stream && (
        <CameraFeed camera={camera} predictVideoRef={predictVideoRef} />
      )}
      <CameraControls camera={camera} onStartIntent={onStartIntent} />
    </div>
  );
}

function PredictionWorkspace({
  classes,
  prediction,
  subscribeToFeatures,
  ...preview
}: Omit<PredictionPanelProps, 'entryReady' | 'hasTrainedModel'>) {
  const { isPredicting, camera } = preview;
  const live = isPredicting && Boolean(camera.stream);
  const space = useDeferredPredictionSpace(classes, camera.active);
  return (
    <div className="grid items-start gap-4 @lg/prediction:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <PredictionCamera {...preview} onStartIntent={space.prepare} />
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
    <EntryReveal asChild kind="reading" active={entryReady} index={1}>
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
            {hasTrainedModel ? <PredictionWorkspace {...workspace} /> : <UntrainedPrediction />}
          </CardContent>
        </Card>
      </section>
    </EntryReveal>
  );
}
