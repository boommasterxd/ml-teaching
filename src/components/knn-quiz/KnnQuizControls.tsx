'use client';

import Image from 'next/image';
import { AnimatePresence } from 'motion/react';
import Button from '@/components/Button';
import { Cat } from '@/components/icons/cat';
import { Dog } from '@/components/icons/dog';
import { X } from '@/components/icons/x';
import { NETWORK_EXAMPLES } from '@/components/network/examples';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AnimatedFeedback } from '@/components/ui/animated-feedback';
import { Field, FieldLabel, FieldDescription, FieldSet, FieldLegend } from '@/components/ui/field';
import { Slider } from '@/components/ui/slider';
import { Text } from '@/components/ui/typography';
import { KNN_MAX_NEIGHBORS, KNN_MIN_NEIGHBORS } from '@/lib/knn-quiz';
import type { KnnQuizState } from './useKnnQuiz';
import { KnnSuccessMedal } from './KnnSuccessMedal';

export function KnnQuizInput({ state }: { state: KnnQuizState }) {
  const example = NETWORK_EXAMPLES[state.round.input];
  return (
    <div className="flex min-w-0 flex-col gap-3 lg:gap-6">
      <div className="flex items-center gap-3 lg:gap-4">
        <Image
          src={example.src}
          alt={example.alt}
          width={80}
          height={80}
          sizes="80px"
          className="size-16 rounded-xl object-cover lg:size-20"
        />
        <div className="flex flex-col gap-1">
          <Text variant="small">Dein Eingabebild</Text>
          <Text variant="muted">Die Raute ist sein neuer Datenpunkt.</Text>
        </div>
      </div>
      <Field className="gap-1 lg:gap-3">
        <FieldLabel id="knn-count-label">1. Finde die nächsten Nachbarn.</FieldLabel>
        <Slider
          id="knn-neighbor-count"
          aria-labelledby="knn-count-label"
          aria-valuetext={`${state.k} ${state.k === 1 ? 'Nachbar' : 'Nachbarn'}`}
          min={KNN_MIN_NEIGHBORS}
          max={KNN_MAX_NEIGHBORS}
          step={1}
          value={state.k}
          onValueChange={state.changeK}
          className="min-h-11"
        />
        <FieldDescription className="tabular-nums">
          K = {state.k} · {state.selected.length} von {state.k} gefunden
        </FieldDescription>
      </Field>
    </div>
  );
}

export function KnnQuizAnswer({
  state,
  onKeyboardSuccess,
}: {
  state: KnnQuizState;
  onKeyboardSuccess: () => void;
}) {
  const ready = state.selected.length === state.k;
  const disabled = !ready || state.result === 'correct';
  const successTitle = state.winner === null ? 'Gleichstand erkannt!' : 'Richtig zugeordnet!';

  function chooseAnswer(signal: KnnQuizState['winner'], keyboard: boolean) {
    if (disabled) return;
    state.chooseClass(signal);
    if (keyboard && signal === state.winner) onKeyboardSuccess();
  }
  return (
    <div className="min-w-0">
      <FieldSet className="gap-3 lg:gap-6">
        <FieldLegend>2. Welche Klasse gewinnt?</FieldLegend>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="min-h-11"
            disabled={disabled}
            onClick={(event) => chooseAnswer('dog', event.detail === 0)}
          >
            <Dog data-icon="inline-start" aria-hidden="true" />
            Hund
          </Button>
          <Button
            variant="outline"
            className="min-h-11"
            disabled={disabled}
            onClick={(event) => chooseAnswer('cat', event.detail === 0)}
          >
            <Cat data-icon="inline-start" aria-hidden="true" />
            Katze
          </Button>
          <Button
            variant="outline"
            className="min-h-11"
            disabled={disabled}
            onClick={(event) => chooseAnswer(null, event.detail === 0)}
          >
            Gleichstand
          </Button>
        </div>
        <Text variant="muted">
          {ready
            ? 'Zähle die Klassen der umkreisten Nachbarn.'
            : 'Wähle zuerst die nächsten Punkte im Diagramm.'}
        </Text>
      </FieldSet>
      <AnimatePresence initial={false}>
        {state.result && (
          <AnimatedFeedback key="result" contentKey={state.result}>
            <Alert
              variant={state.result === 'correct' ? 'achievement' : 'destructive'}
              aria-live={state.result === 'correct' ? 'off' : undefined}
            >
              {state.result === 'correct' ? <KnnSuccessMedal /> : <X animate aria-hidden="true" />}
              <AlertTitle
                className={state.result === 'correct' ? 'self-end font-semibold' : undefined}
              >
                {state.result === 'correct' ? successTitle : 'Zähle noch einmal.'}
              </AlertTitle>
              <AlertDescription>{state.announcement}</AlertDescription>
            </Alert>
          </AnimatedFeedback>
        )}
      </AnimatePresence>
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {state.result === 'correct' ? `${successTitle} ${state.announcement}` : state.announcement}
      </p>
    </div>
  );
}
