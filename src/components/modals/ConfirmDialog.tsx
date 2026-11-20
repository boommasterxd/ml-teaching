import { useRef, type ReactNode } from 'react';
import { useDialogReturnFocus } from '../dialog-state';
import ModalContent from '../ModalContent';
import { DialogFooter, DialogHeading } from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '../ui/alert-dialog';

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
  description: ReactNode;
  /** Label for the confirm (destructive) button. */
  confirmLabel: string;
  /** Label for the cancel button. Defaults to 'Abbrechen'. */
  cancelLabel?: string;
  /** Optional decorative icon beside the heading. */
  icon?: ReactNode;
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
  const rememberOpener = useDialogReturnFocus(isOpen);
  const cancel = useRef<HTMLButtonElement>(null);

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent
        aria-modal
        ref={rememberOpener}
        render={
          <ModalContent maxWidth="md" className="gap-5">
            <DialogHeading icon={icon}>
              <AlertDialogTitle
                id={titleId}
                render={<h3 />}
                className="text-lg font-semibold text-balance leading-tight tracking-tight"
              >
                {title}
              </AlertDialogTitle>
            </DialogHeading>
            <AlertDialogDescription
              id={descId}
              className="text-sm text-muted-foreground leading-relaxed [overflow-wrap:anywhere]"
            >
              {description}
            </AlertDialogDescription>
            <DialogFooter>
              <AlertDialogCancel ref={cancel}>{cancelLabel}</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
            </DialogFooter>
          </ModalContent>
        }
        initialFocus={cancel}
        finalFocus={false}
      />
    </AlertDialog>
  );
}
