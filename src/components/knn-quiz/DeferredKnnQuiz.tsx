'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import Button from '@/components/Button';
import { RotateCcw } from '@/components/icons/rotate-ccw';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Text } from '@/components/ui/typography';
import { createRetryableLoader } from '@/lib/create-retryable-loader';
import {
  KnnQuizChoices,
  KnnQuizFigure,
  KnnQuizInputLayout,
  KnnQuizLayout,
  KnnQuizRestart,
} from './KnnQuizLayout';

const prepareQuiz = createRetryableLoader(() => import('./KnnQuiz'));

export default function DeferredKnnQuiz() {
  const area = useRef<HTMLDivElement>(null);
  const retry = useRef<HTMLButtonElement>(null);
  const near = useInView(area, { margin: '240px 0px', once: true });
  const [hasIntent, setHasIntent] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [failedAttempt, setFailedAttempt] = useState<number | null>(null);
  const [Quiz, setQuiz] = useState<typeof import('./KnnQuiz').default | null>(null);
  const shouldLoad = near || hasIntent;
  const failed = failedAttempt === attempt;

  useEffect(() => {
    if (!shouldLoad) return;
    let active = true;
    void prepareQuiz().then(
      (module) => {
        if (!active) return;
        if (retry.current === document.activeElement) area.current?.focus({ preventScroll: true });
        setQuiz(() => module.default);
      },
      () => {
        if (active) setFailedAttempt(attempt);
      },
    );
    return () => {
      active = false;
    };
  }, [attempt, shouldLoad]);

  const prepare = Quiz || shouldLoad ? undefined : () => setHasIntent(true);
  return (
    <div
      ref={area}
      role="group"
      aria-label="KNN-Übung"
      tabIndex={Quiz ? -1 : 0}
      onFocus={prepare}
      onPointerEnter={prepare}
      onPointerDown={prepare}
    >
      {Quiz ? (
        <Quiz />
      ) : (
        <KnnQuizLayout
          restart={<KnnQuizRestart />}
          input={<KnnQuizInputLayout />}
          figure={
            <KnnQuizFigure
              plot={
                <div className="knn-quiz-plot grid place-items-center">
                  <div className="flex min-w-0 max-w-full flex-col items-center gap-3 p-2 text-center">
                    <Text role="status" variant="muted" className={failed ? 'sr-only' : undefined}>
                      {!failed && 'Die Übung wird geladen …'}
                    </Text>
                    {failed && (
                      <Alert variant="destructive">
                        <AlertDescription>Die Übung konnte nicht geladen werden.</AlertDescription>
                      </Alert>
                    )}
                    {failedAttempt !== null && (
                      <Button
                        ref={retry}
                        variant="outline"
                        aria-disabled={!failed || undefined}
                        onClick={() => {
                          if (failed) setAttempt(attempt + 1);
                        }}
                      >
                        <RotateCcw data-icon="inline-start" aria-hidden="true" />
                        Erneut versuchen
                      </Button>
                    )}
                  </div>
                </div>
              }
            />
          }
          answer={<KnnQuizChoices />}
        />
      )}
    </div>
  );
}
