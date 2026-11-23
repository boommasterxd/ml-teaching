'use client';

import { Activity, useEffect, useLayoutEffect, useRef, useState } from 'react';
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

/** Prepare the local exercise on intent and open it on activation. */
export default function DeferredKnnQuiz() {
  const openButton = useRef<HTMLButtonElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const restoreFocus = useRef(false);
  const mounted = useRef(false);
  const [Quiz, setQuiz] = useState<typeof import('./KnnQuiz').default | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const load = (activate: boolean) => {
    if (activate) {
      setFailed(false);
      setLoading(true);
    }
    void prepareQuiz()
      .then((module) => {
        if (!mounted.current) return;
        setQuiz(() => module.default);
        if (activate) {
          restoreFocus.current = document.activeElement === openButton.current;
          setOpen(true);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted.current && activate) {
          setFailed(true);
          setLoading(false);
        }
      });
  };
  const prepare = () => {
    if (!open) load(false);
  };
  useLayoutEffect(() => {
    if (!open || !restoreFocus.current) return;
    restoreFocus.current = false;
    title.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return (
    <div onPointerEnter={prepare} onFocusCapture={prepare} onPointerDown={prepare}>
      {Quiz && (
        <Activity mode={open ? 'visible' : 'hidden'}>
          <Quiz titleRef={title} />
        </Activity>
      )}
      {!open && (
        <Card aria-busy={loading || undefined}>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>KNN selbst ausprobieren</EmptyTitle>
              {(failed || loading) && (
                <EmptyDescription>
                  {failed ? 'Die Übung konnte nicht geladen werden.' : 'Die Übung wird geladen …'}
                </EmptyDescription>
              )}
            </EmptyHeader>
            <EmptyContent>
              <Button
                ref={openButton}
                variant="outline"
                aria-disabled={loading || undefined}
                onClick={() => {
                  if (!loading) load(true);
                }}
              >
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
