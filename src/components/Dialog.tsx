'use client';

import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import {
  Dialog as DialogRoot,
  DialogContent,
  DialogOverlay,
  InitialDialog,
  InitialDialogContent,
} from './ui/dialog';
import { canReturnFocus, getReturnFocusCandidates } from './dialog-state';

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
  const returnFocus = useRef<(HTMLElement | null)[]>([]);
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const rememberOpener = useCallback((node: HTMLDivElement | null) => {
    if (node && returnFocus.current.length === 0) {
      returnFocus.current = getReturnFocusCandidates(document.activeElement as HTMLElement);
    }
    setContent(node);
  }, []);

  useEffect(() => {
    if (!isOpen && !content && returnFocus.current.length > 0) {
      const nextDialog = document.querySelector('[role="dialog"][data-open]');
      if (!nextDialog && document.activeElement === document.body) {
        const target = returnFocus.current.find(canReturnFocus);
        if (target) target.focus({ preventScroll: true });
      }
      returnFocus.current = [];
    }
  }, [isOpen, content]);

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
      {isOpen && (
        <BaseDialog.Portal>
          <DialogOverlay>
            <DialogContent
              {...labels}
              ref={rememberOpener}
              render={children}
              initialFocus
              finalFocus={false}
            />
          </DialogOverlay>
        </BaseDialog.Portal>
      )}
    </DialogRoot>
  );
}
