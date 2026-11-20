'use client';

import type { ReactElement } from 'react';
import {
  Dialog as DialogRoot,
  DialogContent,
  DialogBackdrop,
  DialogPortal,
  DialogViewport,
  InitialDialog,
  InitialDialogContent,
} from './ui/dialog';
import { useDialogReturnFocus } from './dialog-state';

interface DialogProps {
  isOpen: boolean;
  onClose?: () => void;
  labelledBy: string;
  describedBy?: string;
  initialContent?: boolean;
  children: ReactElement<{ className?: string }>;
}

/** Animate UI owns entry motion, and the modal primitive owns focus. */
export default function Dialog({
  isOpen,
  onClose,
  labelledBy,
  describedBy,
  initialContent = false,
  children,
}: DialogProps) {
  const rememberOpener = useDialogReturnFocus(isOpen);

  const labels = {
    'aria-modal': true,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
  } as const;

  if (initialContent) {
    return (
      <DialogRoot open={false}>
        {isOpen && (
          <InitialDialog
            {...labels}
            role="dialog"
            data-open=""
            onCancel={(event) => {
              event.preventDefault();
              onClose?.();
            }}
          >
            <InitialDialogContent render={children} />
          </InitialDialog>
        )}
      </DialogRoot>
    );
  }

  return (
    <DialogRoot
      open={isOpen}
      modal="trap-focus"
      disablePointerDismissal
      onOpenChange={(open, details) => {
        if (open) return;
        if (onClose) onClose();
        else details.cancel();
      }}
    >
      <DialogPortal>
        <DialogBackdrop />
        <DialogViewport lockScroll>
          <DialogContent
            {...labels}
            ref={rememberOpener}
            render={children}
            initialFocus
            finalFocus={false}
          />
        </DialogViewport>
      </DialogPortal>
    </DialogRoot>
  );
}
