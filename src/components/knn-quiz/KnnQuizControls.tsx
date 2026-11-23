'use client';

import Image from 'next/image';
import { AnimatePresence } from 'motion/react';
import { CheckCircle2 } from '@/components/icons/check-circle2';
import { X } from '@/components/icons/x';
import { NETWORK_EXAMPLES } from '@/components/network/examples';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AnimatedFeedback } from '@/components/ui/animated-feedback';
import { Slider } from '@/components/ui/slider';
import { KNN_MAX_NEIGHBORS, KNN_MIN_NEIGHBORS } from '@/lib/knn-quiz';
import type { KnnQuizState } from './useKnnQuiz';
import {
  KnnQuizChoices,
  KnnQuizInputLayout,
  knnQuizImageClass,
  neighborLabelId,
} from './KnnQuizLayout';

export function KnnQuizInput({ state }: { state: KnnQuizState }) {
  const example = NETWORK_EXAMPLES[state.round.input];
  return (
    <KnnQuizInputLayout
      image={
        <Image
          src={example.src}
          alt={example.alt}
          width={80}
          height={80}
          sizes="80px"
          className={knnQuizImageClass}
        />
      }
      slider={
        <Slider
          id="knn-neighbor-count"
          aria-labelledby={neighborLabelId}
          aria-valuetext={`${state.k} ${state.k === 1 ? 'Nachbar' : 'Nachbarn'}`}
          min={KNN_MIN_NEIGHBORS}
          max={KNN_MAX_NEIGHBORS}
          step={1}
          value={state.k}
          onValueChange={state.changeK}
          className="min-h-11"
        />
      }
      progress={`K = ${state.k} · ${state.selected.length} von ${state.k} gefunden`}
    />
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
    <>
      <KnnQuizChoices ready={ready} disabled={disabled} chooseAnswer={chooseAnswer} />
      <AnimatePresence initial={false}>
        {state.result && (
          <AnimatedFeedback
            key="result"
            contentKey={state.result}
            contentClassName="knn-quiz-feedback"
          >
            <Alert
              variant={state.result === 'correct' ? 'achievement' : 'destructive'}
              aria-live={state.result === 'correct' ? 'off' : undefined}
            >
              {state.result === 'correct' ? (
                <CheckCircle2
                  className="row-span-2 size-12 text-success"
                  animate
                  persistOnAnimateEnd
                  aria-hidden="true"
                />
              ) : (
                <X animate aria-hidden="true" />
              )}
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
    </>
  );
}
