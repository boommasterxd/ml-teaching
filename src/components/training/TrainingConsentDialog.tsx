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
import { DialogFooter, DialogHeading } from '../ui/dialog';

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
  const actionLayout = 'h-auto min-h-11 whitespace-normal';

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
          <ModalContent className={cn('gap-5 p-4 sm:p-6', canRevokeCamera && 'sm:max-w-xl')}>
            <DialogHeading icon={<ShieldCheck animate={isOpen} aria-hidden="true" />}>
              <AlertDialogTitle className="text-lg leading-tight font-semibold">
                Einstellungen zum Bildtraining
              </AlertDialogTitle>
            </DialogHeading>
            <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Ein Widerruf beendet das Bildtraining und löscht vorhandene Trainingsdaten.
            </AlertDialogDescription>
            <DialogFooter
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
