'use client';

import { useRef } from 'react';
import { useKnnQuiz } from './useKnnQuiz';
import KnnQuizPlot from './KnnQuizPlot';
import { KnnQuizInput, KnnQuizAnswer } from './KnnQuizControls';
import { KnnQuizLayout, KnnQuizRestart } from './KnnQuizLayout';

export default function KnnQuiz() {
  const state = useKnnQuiz();
  const restartButton = useRef<HTMLButtonElement>(null);
  return (
    <KnnQuizLayout
      restart={<KnnQuizRestart ref={restartButton} onClick={state.restart} />}
      input={<KnnQuizInput state={state} />}
      figure={<KnnQuizPlot state={state} />}
      answer={
        <KnnQuizAnswer state={state} onKeyboardSuccess={() => restartButton.current?.focus()} />
      }
    />
  );
}
