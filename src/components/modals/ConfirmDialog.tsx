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
import { DialogDescription, DialogFooter, DialogTitle } from '../ui/dialog';

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
  /** Optional decorative icon beside the heading. */
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
      <ModalContent maxWidth="md" className="gap-5">
        <DialogTitle asChild icon={icon}>
          <h3 id={titleId} className="text-balance text-2xl leading-tight tracking-tight">
            {title}
          </h3>
        </DialogTitle>
        <DialogDescription id={descId} className="leading-relaxed [overflow-wrap:anywhere]">
          {description}
        </DialogDescription>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </ModalContent>
    </Dialog>
  );
}
