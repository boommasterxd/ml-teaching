/**
 * Generische Dialog-Basiskomponente.
 * Kapselt Overlay, Focus-Trap und Scroll-Lock für alle Modal-Dialoge.
 * Stellt WCAG-konforme ARIA-Attribute bereit.
 */
import type React from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import useScrollLock from '../hooks/useScrollLock';

interface DialogProps {
  isOpen: boolean;
  /** onClose ist optional – bei Dialogen ohne Escape-Handler (z. B. Ladescreen) weglassen */
  onClose?: () => void;
  /** ID des Elements, das den Dialog-Titel enthält (aria-labelledby) */
  labelledBy: string;
  /** ID des Elements, das den Dialog beschreibt (aria-describedby) – optional */
  describedBy?: string;
  children: React.ReactNode;
}

export default function Dialog({
  isOpen,
  onClose,
  labelledBy,
  describedBy,
  children,
}: DialogProps) {
  const dialogRef = useFocusTrap(isOpen, false, onClose);
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
