'use client';

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Dialog as RadixDialog } from 'radix-ui';
import { Dialog as DialogRoot, DialogContent, DialogOverlay } from './ui/dialog';
import { canReturnFocus, getReturnFocusCandidates } from './dialog-state';

interface DialogProps {
  isOpen: boolean;
  onClose?: () => void;
  labelledBy: string;
  describedBy?: string;
  children: ReactElement;
}

/** Animate UI owns animation; Radix owns modal focus and RemoveScroll contains scrolling. */
export default function Dialog({
  isOpen,
  onClose,
  labelledBy,
  describedBy,
  children,
}: DialogProps) {
  const returnFocus = useRef<(HTMLElement | null)[]>([]);
  const [content, setContent] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen && !content && returnFocus.current.length > 0) {
      const nextDialog = document.querySelector('[role="dialog"][data-state="open"]');
      if (!nextDialog && document.activeElement === document.body) {
        const target = returnFocus.current.find(canReturnFocus);
        if (target) target.focus({ preventScroll: true });
      }
      returnFocus.current = [];
    }
  }, [isOpen, content]);

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose?.();
      }}
    >
      {/* The native portal releases modality immediately; Animate UI retains entry motion. */}
      <RadixDialog.Portal>
        <DialogOverlay>
          <DialogContent
            ref={setContent}
            asChild
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            onOpenAutoFocus={() => {
              returnFocus.current = getReturnFocusCandidates(document.activeElement as HTMLElement);
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
            }}
            onEscapeKeyDown={(event) => {
              if (!onClose) event.preventDefault();
            }}
            onInteractOutside={(event) => event.preventDefault()}
          >
            {children}
          </DialogContent>
        </DialogOverlay>
      </RadixDialog.Portal>
    </DialogRoot>
  );
}
