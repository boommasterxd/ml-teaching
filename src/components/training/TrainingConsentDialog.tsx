'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { useDialogReturnFocus } from '../dialog-state';
import { ShieldCheck } from '../icons/shield-check';
import ModalContent from '../ModalContent';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { DialogBody, DialogFooter, DialogHeading } from '../ui/dialog';

interface TrainingConsentDialogProps {
  isOpen: boolean;
  canRevokeCamera: boolean;
  onClose: () => void;
  onRevokeCamera: () => void;
  onRevokeConsent: () => void;
  onRevokeIntent: () => void;
  onExited: () => void;
}

export default function TrainingConsentDialog({
  isOpen,
  canRevokeCamera,
  onClose,
  onRevokeCamera,
  onRevokeConsent,
  onRevokeIntent,
  onExited,
}: TrainingConsentDialogProps) {
  const opener = useDialogReturnFocus(isOpen);
  const closeButton = useRef<HTMLButtonElement>(null);
  const actionLayout = 'h-auto min-h-11 py-1 leading-tight whitespace-normal';

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent
        aria-modal
        ref={opener}
        initialFocus={closeButton}
        finalFocus={false}
        onExited={onExited}
        render={
          <ModalContent
            className={cn(
              '[--dialog-gap:1.25rem] [--dialog-padding:1rem] sm:[--dialog-padding:1.5rem]',
              canRevokeCamera && 'sm:max-w-xl',
            )}
          >
            <DialogHeading icon={<ShieldCheck animate={isOpen} aria-hidden="true" />}>
              <AlertDialogTitle
                id="training-settings-title"
                className="text-lg leading-tight font-semibold"
              >
                Einstellungen zum Bildtraining
              </AlertDialogTitle>
            </DialogHeading>
            <DialogBody tabIndex={0} role="region" aria-labelledby="training-settings-title">
              <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
                Ein Widerruf beendet das Bildtraining und löscht vorhandene Trainingsdaten.
              </AlertDialogDescription>
            </DialogBody>
            <DialogFooter
              layout="auto-fit"
              className={cn(canRevokeCamera && 'sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)]')}
            >
              <AlertDialogCancel ref={closeButton} className={actionLayout}>
                Schließen
              </AlertDialogCancel>
              {canRevokeCamera && (
                <Button
                  type="button"
                  variant="outline"
                  className={actionLayout}
                  onClick={() => {
                    onClose();
                    onRevokeCamera();
                  }}
                >
                  Kamera ausschalten
                </Button>
              )}
              <AlertDialogAction
                type="button"
                className={actionLayout}
                onPointerEnter={onRevokeIntent}
                onPointerDown={onRevokeIntent}
                onFocus={onRevokeIntent}
                onClick={() => {
                  onClose();
                  onRevokeConsent();
                }}
              >
                Einwilligung widerrufen
              </AlertDialogAction>
            </DialogFooter>
          </ModalContent>
        }
      />
    </AlertDialog>
  );
}
