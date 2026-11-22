'use client';

import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import type { useTrainingWithdrawal } from './use-training-withdrawal';

export default function TrainingWithdrawalFeedback({
  withdrawal,
  resourcesReleased,
  onRestartIntent,
}: {
  withdrawal: ReturnType<typeof useTrainingWithdrawal>;
  resourcesReleased: boolean;
  onRestartIntent: () => void;
}) {
  const { finish, prepareReturn } = withdrawal;
  const phase = withdrawal.active?.phase;
  if (!phase || phase === 'waiting' || !resourcesReleased) return null;
  const SuccessDialog = withdrawal.Dialog;
  if (SuccessDialog) {
    return (
      <SuccessDialog
        open={phase === 'open'}
        onReturn={() => withdrawal.close('return')}
        onRestart={() => withdrawal.close('restart')}
        onReturnIntent={prepareReturn}
        onRestartIntent={onRestartIntent}
        onExited={() => {
          if (phase === 'return' || phase === 'restart') finish(phase);
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
      <div className="col-start-2 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onPointerEnter={prepareReturn}
          onPointerDown={prepareReturn}
          onFocus={prepareReturn}
          onClick={() => finish('return')}
        >
          Zurück zur Seite
        </Button>
        <Button
          onPointerEnter={onRestartIntent}
          onPointerDown={onRestartIntent}
          onFocus={onRestartIntent}
          onClick={() => finish('restart')}
        >
          Training erneut öffnen
        </Button>
      </div>
    </Alert>
  );
}
