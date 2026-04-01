/**
 * ConfirmDialog.tsx
 *
 * Generic confirmation dialog with customizable title, description, icon, and action labels.
 * Wraps the base Dialog component to provide a consistent destructive-action confirmation pattern.
 */
import type React from 'react';
import Dialog from '../Dialog';
import ModalContent from '../ModalContent';
import Button from '../Button';

/**
 * Props for the ConfirmDialog component.
 */
interface ConfirmDialogProps {
  /** Controls whether the dialog is visible. */
  isOpen: boolean;
  /** Called when the user dismisses the dialog without confirming. */
  onClose: () => void;
  /** Called when the user clicks the confirm button. */
  onConfirm: () => void;
  /** ID applied to the heading element, used for `aria-labelledby`. */
  titleId: string;
  /** ID applied to the description element, used for `aria-describedby`. */
  descId: string;
  /** Heading text displayed at the top of the dialog. */
  title: string;
  /** Body content explaining the action to be confirmed. */
  description: React.ReactNode;
  /** Label for the confirm (destructive) button. */
  confirmLabel: string;
  /** Label for the cancel button. Defaults to 'Abbrechen'. */
  cancelLabel?: string;
  /** Optional icon rendered in a circular badge above the title. */
  icon?: React.ReactNode;
}

/** Renders a destructive-action confirmation dialog with cancel and confirm buttons. */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  titleId,
  descId,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Abbrechen',
  icon,
}: ConfirmDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} labelledBy={titleId} describedBy={descId}>
      <ModalContent maxWidth="md" className="p-6">
        {icon && (
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4" aria-hidden="true">
            {icon}
          </div>
        )}
        <h3 id={titleId} className="text-xl font-bold text-zinc-900 mb-2">{title}</h3>
        <p id={descId} className="text-zinc-600 mb-6 text-sm">{description}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            {cancelLabel}
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="flex-1">
            {confirmLabel}
          </Button>
        </div>
      </ModalContent>
    </Dialog>
  );
}
