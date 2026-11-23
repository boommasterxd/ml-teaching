import type { ReactNode } from 'react';
import Button from '@/components/Button';
import { Cat } from '@/components/icons/cat';
import { Dog } from '@/components/icons/dog';
import { RotateCcw } from '@/components/icons/rotate-ccw';
import { KnnPoint, KnnQuery } from '@/components/network/KnnArtwork';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Text } from '@/components/ui/typography';
import type { ExampleSignal } from '@/lib/knn';
import { cn } from '@/lib/utils';

export function KnnQuizLayout({
  restart,
  input,
  figure,
  answer,
}: {
  restart: ReactNode;
  input: ReactNode;
  figure: ReactNode;
  answer: ReactNode;
}) {
  return (
    <Card className="knn-quiz-card gap-4 lg:gap-6">
      <CardHeader className="knn-quiz-header flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle as="h3">Hund oder Katze?</CardTitle>
        {restart}
      </CardHeader>
      <CardContent className="knn-quiz-layout">
        {input}
        {figure}
        <div className="@container/knn-answer min-w-0">
          <div className="knn-quiz-answer min-w-0">{answer}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KnnQuizRestart({
  ref,
  onClick,
}: Pick<React.ComponentProps<typeof Button>, 'ref' | 'onClick'>) {
  return (
    <Button
      ref={ref}
      variant="ghost"
      className={cn('min-h-11', !onClick && 'invisible')}
      disabled={!onClick}
      onClick={onClick}
    >
      <RotateCcw data-icon="inline-start" aria-hidden="true" />
      Neue Runde
    </Button>
  );
}

export const knnQuizImageClass = 'size-16 shrink-0 rounded-xl object-cover lg:size-20';
export const neighborLabelId = 'knn-count-label';

export function KnnQuizInputLayout({
  image,
  slider,
  progress = 'K = 3 · 0 von 3 gefunden',
}: {
  image?: ReactNode;
  slider?: ReactNode;
  progress?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-3 lg:gap-6', !slider && 'invisible')}>
      <div className="flex items-center gap-3 lg:gap-4">
        {image ?? <div className={knnQuizImageClass} />}
        <div className="flex flex-col gap-1">
          <Text variant="small">Dein Eingabebild</Text>
          <Text variant="muted">Die Raute ist sein neuer Datenpunkt.</Text>
        </div>
      </div>
      <Field className="gap-1 lg:gap-3">
        <FieldLabel id={neighborLabelId}>1. Finde die nächsten Nachbarn.</FieldLabel>
        {slider ?? <div className="min-h-11" />}
        <FieldDescription className="tabular-nums">{progress}</FieldDescription>
      </Field>
    </div>
  );
}

export function KnnQuizFigure({ plot }: { plot: ReactNode }) {
  return (
    <div className="knn-quiz-figure">
      {plot}
      <div
        className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
        aria-label="Legende"
      >
        {(['dog', 'cat'] as const).map((signal) => (
          <Text key={signal} variant="muted" className="flex items-center gap-1">
            <svg viewBox="-12 -12 24 24" className="size-6" aria-hidden="true">
              <KnnPoint x={0} y={0} signal={signal} />
            </svg>
            {signal === 'dog' ? 'Hund' : 'Katze'}
          </Text>
        ))}
        <Text variant="muted" className="flex items-center gap-1">
          <svg viewBox="-12 -12 24 24" className="size-6" aria-hidden="true">
            <KnnQuery x={0} y={0} />
          </svg>
          Neues Bild
        </Text>
      </div>
    </div>
  );
}

const answerChoices = [
  { signal: 'dog', label: 'Hund', Icon: Dog },
  { signal: 'cat', label: 'Katze', Icon: Cat },
  { signal: null, label: 'Gleichstand', Icon: null },
] as const;

export function KnnQuizChoices({
  ready = false,
  disabled = true,
  chooseAnswer,
}: {
  ready?: boolean;
  disabled?: boolean;
  chooseAnswer?: (signal: ExampleSignal | null, keyboard: boolean) => void;
}) {
  return (
    <FieldSet className={cn('min-w-0 gap-3 lg:gap-6', !chooseAnswer && 'invisible')}>
      <FieldLegend>2. Welche Klasse gewinnt?</FieldLegend>
      <div className="flex flex-wrap gap-2">
        {answerChoices.map(({ signal, label, Icon }) => (
          <Button
            key={label}
            variant="outline"
            size="sm"
            className="min-h-11"
            disabled={disabled}
            onClick={(event) => chooseAnswer?.(signal, event.detail === 0)}
          >
            {Icon && <Icon data-icon="inline-start" aria-hidden="true" />}
            {label}
          </Button>
        ))}
      </div>
      <Text variant="muted">
        {ready
          ? 'Zähle die Klassen der umkreisten Nachbarn.'
          : 'Wähle zuerst die nächsten Punkte im Diagramm.'}
      </Text>
    </FieldSet>
  );
}
