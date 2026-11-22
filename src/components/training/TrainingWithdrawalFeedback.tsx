'use client';

import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import type { useTrainingWithdrawal } from './use-training-withdrawal';

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
    <Alert
      variant="success"
      role="status"
      className="fixed inset-x-4 bottom-4 z-40 mx-auto w-auto max-w-md"
    >
      <AlertDescription>Deine Einwilligung wurde widerrufen.</AlertDescription>
      <Button
        variant={actionVariant}
        className="col-start-2 justify-self-start"
        onPointerEnter={prepareHome}
        onPointerDown={prepareHome}
        onFocus={prepareHome}
        onClick={finish}
      >
        {actionLabel}
      </Button>
    </Alert>
  );
}
