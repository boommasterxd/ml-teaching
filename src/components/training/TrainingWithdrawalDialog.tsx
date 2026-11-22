'use client';

import { useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import Button from '../Button';
import Dialog from '../Dialog';
import { CheckCircle2 } from '../icons/check-circle2';
import ModalContent from '../ModalContent';
import { DialogBody, DialogDescription, DialogFooter, DialogTitle } from '../ui/dialog';

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
      <ModalContent
        maxWidth="lg"
        className="text-center [--dialog-gap:1.25rem] [--dialog-padding:1rem] sm:[--dialog-padding:1.5rem]"
      >
        <div className="mx-auto grid size-[min(4rem,16dvh)] shrink-0 place-items-center rounded-full bg-success-soft text-success">
          <CheckCircle2
            className="size-[min(2.25rem,10dvh)]"
            animate={open && !reduceMotion}
            aria-hidden="true"
          />
        </div>
        <div className="flex min-h-0 flex-col gap-2">
          <DialogTitle id="training-withdrawal-title" className="text-xl">
            Einwilligung widerrufen
          </DialogTitle>
          <DialogBody tabIndex={0} role="region" aria-labelledby="training-withdrawal-title">
            <DialogDescription id="training-withdrawal-message">
              Das Bildtraining wurde beendet und deine lokalen Trainingsdaten wurden gelöscht.
            </DialogDescription>
          </DialogBody>
        </div>
        <DialogFooter layout="auto-fit">
          <Button
            variant="secondary"
            className="h-auto min-h-11 whitespace-normal"
            onPointerEnter={onReturnIntent}
            onPointerDown={onReturnIntent}
            onFocus={onReturnIntent}
            onClick={onReturn}
          >
            Zurück zur Seite
          </Button>
          <Button
            className="h-auto min-h-11 whitespace-normal"
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
