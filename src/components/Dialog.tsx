'use client';

import { useRef, type ReactElement } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  Dialog as DialogRoot,
  DialogContent,
  DialogBackdrop,
  DialogPortal,
  DialogViewport,
  InitialDialog,
  InitialDialogContent,
} from './ui/dialog';
import {
  DialogExitObserver,
  revealReturnedFocus,
  useDialogExitCallback,
  useDialogReturnFocus,
} from './dialog-state';

interface DialogProps {
  isOpen: boolean;
  onClose?: () => void;
  labelledBy: string;
  describedBy?: string;
  initialContent?: boolean;
  restoreFocus?: boolean;
  resolveReturnFocus?: () => HTMLElement | null;
  onExited?: () => void;
  children: ReactElement<{ className?: string }>;
}

/** Animate UI owns entry motion, and the modal primitive owns focus. */
export default function Dialog({
  isOpen,
  onClose,
  labelledBy,
  describedBy,
  initialContent = false,
  restoreFocus = true,
  resolveReturnFocus,
  onExited,
  children,
}: DialogProps) {
  const restoredFocus = useRef<HTMLElement | null>(null);
  const rememberOpener = useDialogReturnFocus(
    isOpen && restoreFocus,
    resolveReturnFocus,
    restoredFocus,
  );
  const exitCallback = useDialogExitCallback(
    resolveReturnFocus
      ? () => {
          // The closing portal can still restore scroll after focus has moved.
          requestAnimationFrame(() => revealReturnedFocus(restoredFocus));
          onExited?.();
        }
      : onExited,
  );

  const labels = {
    'aria-modal': true,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
  } as const;

  if (initialContent) {
    return (
      <DialogRoot open={false}>
        <AnimatePresence initial={false} onExitComplete={onExited}>
          {isOpen && (
            <InitialDialog
              {...labels}
              role="dialog"
              onCancel={(event) => {
                event.preventDefault();
                onClose?.();
              }}
            >
              <InitialDialogContent render={children} />
            </InitialDialog>
          )}
        </AnimatePresence>
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
        {(onExited || resolveReturnFocus) && <DialogExitObserver callback={exitCallback} />}
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
