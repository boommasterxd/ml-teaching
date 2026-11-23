'use client';

import { useLayoutEffect, useRef } from 'react';
import { CheckCircle2 } from '../icons/check-circle2';
import { Alert, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import type { useTrainingWithdrawal } from './use-training-withdrawal';

function TrainingWithdrawalNotice({
  actionLabel,
  finish,
  prepareHome,
}: Pick<ReturnType<typeof useTrainingWithdrawal>, 'finish' | 'prepareHome'> & {
  actionLabel: string;
}) {
  const action = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const active = document.activeElement;
    if (active?.matches('body, #main-content, #main-content h1[tabindex="-1"]')) {
      action.current?.focus({ preventScroll: true });
    }
  }, []);

  return (
    <Alert
      role="presentation"
      className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-40 mx-auto flex max-h-[80dvh] w-auto max-w-lg flex-col rounded-2xl border-(--glass-line) [background:var(--glass-surface)] p-3 shadow-(--glass-highlight)"
    >
      <div className="min-h-0 overflow-y-auto p-1">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <CheckCircle2
              className="size-6 shrink-0 text-success"
              animate
              persistOnAnimateEnd
              aria-hidden="true"
            />
            <AlertTitle
              id="training-withdrawal-notice"
              role="status"
              className="line-clamp-none leading-snug"
            >
              Deine Einwilligung wurde widerrufen.
            </AlertTitle>
          </div>
          <Button
            ref={action}
            variant="outline"
            className="h-auto min-h-11 whitespace-normal"
            aria-describedby="training-withdrawal-notice"
            onPointerEnter={prepareHome}
            onPointerDown={prepareHome}
            onFocus={prepareHome}
            onClick={finish}
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </Alert>
  );
}

export default function TrainingWithdrawalFeedback({
  withdrawal,
  resourcesReleased,
}: {
  withdrawal: ReturnType<typeof useTrainingWithdrawal>;
  resourcesReleased: boolean;
}) {
  const { close, finish, prepareHome, leavesTraining } = withdrawal;
  const phase = withdrawal.active?.phase;
  if (!phase || phase === 'waiting' || !resourcesReleased) return null;
  const actionLabel = leavesTraining ? 'Training verlassen' : 'Schließen';
  const actionVariant = leavesTraining ? 'default' : 'secondary';
  const SuccessDialog = withdrawal.Dialog;
  if (SuccessDialog) {
    return (
      <SuccessDialog
        open={phase === 'open'}
        actionLabel={actionLabel}
        actionVariant={actionVariant}
        onClose={close}
        onCloseIntent={prepareHome}
        onExited={() => {
          if (phase === 'closing') finish();
        }}
      />
    );
  }
  if (phase !== 'open' || !withdrawal.failed) return null;
  return (
    <TrainingWithdrawalNotice actionLabel={actionLabel} finish={finish} prepareHome={prepareHome} />
  );
}
