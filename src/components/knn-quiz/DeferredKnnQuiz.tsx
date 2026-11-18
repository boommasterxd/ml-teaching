'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import Button from '@/components/Button';
import { Users } from '@/components/icons/users';
import { RotateCcw } from '@/components/icons/rotate-ccw';
import { Card } from '@/components/ui/card';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';

let pending: Promise<typeof import('./KnnQuiz')> | undefined;
function prepareQuiz() {
  pending ??= import('./KnnQuiz').catch((error: unknown) => {
    pending = undefined;
    throw error;
  });
  return pending;
}

/** Start a local exercise near the viewport; intent shares the same retryable chunk. */
export default function DeferredKnnQuiz() {
  const area = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const [Quiz, setQuiz] = useState<ComponentType | null>(null);
  const [failed, setFailed] = useState(false);
  const prepare = () => {
    void prepareQuiz().catch(() => {});
  };
  const activate = () => {
    setFailed(false);
    void prepareQuiz()
      .then((module) => {
        if (mounted.current) setQuiz(() => module.default);
      })
      .catch(() => {
        if (mounted.current) setFailed(true);
      });
  };
  useEffect(() => {
    mounted.current = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          activate();
          observer.disconnect();
        }
      },
      { rootMargin: '240px' },
    );
    if (area.current) observer.observe(area.current);
    return () => {
      mounted.current = false;
      observer.disconnect();
    };
  }, []);
  return (
    <div ref={area} onPointerEnter={prepare} onFocusCapture={prepare} onPointerDown={prepare}>
      {Quiz ? (
        <Quiz />
      ) : (
        <Card className="knn-quiz-placeholder">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>KNN selbst ausprobieren</EmptyTitle>
              <EmptyDescription>
                {failed ? 'Die Übung konnte nicht geladen werden.' : 'Die Übung wird vorbereitet.'}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={activate}>
                <RotateCcw data-icon="inline-start" aria-hidden="true" />
                {failed ? 'Erneut versuchen' : 'Übung öffnen'}
              </Button>
            </EmptyContent>
          </Empty>
        </Card>
      )}
    </div>
  );
}
