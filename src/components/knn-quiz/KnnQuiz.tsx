'use client';

import type { Ref } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/Button';
import { RotateCcw } from '@/components/icons/rotate-ccw';
import { useKnnQuiz } from './useKnnQuiz';
import KnnQuizPlot from './KnnQuizPlot';
import { KnnQuizInput, KnnQuizAnswer } from './KnnQuizControls';

export default function KnnQuiz({ titleRef }: { titleRef?: Ref<HTMLHeadingElement> }) {
  const state = useKnnQuiz();
  return (
    <Card className="knn-quiz-card gap-4 lg:gap-6">
      <CardHeader className="knn-quiz-header flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle as="h3" tabIndex={-1} ref={titleRef}>
          Hund oder Katze?
        </CardTitle>
        <Button variant="ghost" className="min-h-11" onClick={state.restart}>
          <RotateCcw data-icon="inline-start" aria-hidden="true" />
          Neue Runde
        </Button>
      </CardHeader>
      <CardContent className="knn-quiz-layout">
        <KnnQuizInput state={state} />
        <KnnQuizPlot state={state} />
        <KnnQuizAnswer state={state} />
      </CardContent>
    </Card>
  );
}
