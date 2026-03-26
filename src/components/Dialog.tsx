/**
 * Generic base dialog component.
 * Wraps overlay, focus trap, and scroll lock for all modal dialogs.
 * Provides WCAG-compliant ARIA attributes.
 */
import type React from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import useScrollLock from '../hooks/useScrollLock';

interface DialogProps {
  isOpen: boolean;
  /** Optional — omit for dialogs that cannot be dismissed (e.g. loading screen). */
  onClose?: () => void;
  /** ID of the element that contains the dialog title (aria-labelledby). */
  labelledBy: string;
  /** ID of the element that describes the dialog (aria-describedby) — optional. */
  describedBy?: string;
  children: React.ReactNode;
}

/** Renders a modal overlay with focus trapping, scroll lock, and ARIA roles. */
export default function Dialog({
  isOpen,
  onClose,
  labelledBy,
  describedBy,
  children,
}: DialogProps) {
  const dialogRef = useFocusTrap(isOpen, true, onClose);
  useScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-zinc-900/80 backdrop-blur-sm overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      {children}
    </div>
  );
}
