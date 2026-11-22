'use client';

import { useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import Button from '../Button';
import Dialog from '../Dialog';
import { CheckCircle2 } from '../icons/check-circle2';
import ModalContent from '../ModalContent';
import { DialogDescription, DialogFooter, DialogTitle } from '../ui/dialog';

export interface WithdrawalDialogProps {
  open: boolean;
  onReturn: () => void;
  onRestart: () => void;
  onReturnIntent: () => void;
  onRestartIntent: () => void;
  onExited: () => void;
}

export default function TrainingWithdrawalDialog({
  open,
  onReturn,
  onRestart,
  onReturnIntent,
  onRestartIntent,
  onExited,
}: WithdrawalDialogProps) {
  const reduceMotion = useShouldReduceMotion();
  return (
    <Dialog
      isOpen={open}
      labelledBy="training-withdrawal-title"
      describedBy="training-withdrawal-message"
      onClose={onReturn}
      restoreFocus={false}
      onExited={onExited}
    >
      <ModalContent maxWidth="lg" className="gap-5 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-success-soft text-success">
          <CheckCircle2 size={36} animate={open && !reduceMotion} aria-hidden="true" />
        </div>
        <div className="grid gap-2">
          <DialogTitle id="training-withdrawal-title" className="text-xl">
            Einwilligung widerrufen
          </DialogTitle>
          <DialogDescription id="training-withdrawal-message">
            Das Bildtraining wurde beendet und deine lokalen Trainingsdaten wurden gelöscht.
          </DialogDescription>
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            className="min-h-11"
            onPointerEnter={onReturnIntent}
            onPointerDown={onReturnIntent}
            onFocus={onReturnIntent}
            onClick={onReturn}
          >
            Zurück zur Seite
          </Button>
          <Button
            className="min-h-11"
            onPointerEnter={onRestartIntent}
            onPointerDown={onRestartIntent}
            onFocus={onRestartIntent}
            onClick={onRestart}
          >
            Training erneut öffnen
          </Button>
        </DialogFooter>
      </ModalContent>
    </Dialog>
  );
}
