/**
 * Generic confirmation dialog with customizable title, description, icon, and action labels.
 */
import type React from 'react';
import Dialog from '../Dialog';
import ModalContent from '../ModalContent';
import Button from '../Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titleId: string;
  descId: string;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
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
