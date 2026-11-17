/**
 * LoadingModal.tsx
 *
 * Blocks workspace interaction while models load, with native consent withdrawal.
 */
import { Loader2 } from '../icons/loader2';
import Dialog from '../Dialog';
import ModalContent from '../ModalContent';
import { DialogTitle } from '../ui/dialog';
import TrainingWithdrawal from '../TrainingWithdrawal';

/**
 * Props for the LoadingModal component.
 */
interface LoadingModalProps {
  /** Controls whether the modal is visible. */
  isOpen: boolean;
  /** Dynamic status text displayed below the spinner (e.g. download progress). */
  loadingText: string;
}

/**
 * Displays a centered spinner and a dynamic status message while ML models load.
 * Withdrawal reloads the document instead of dismissing an unfinished load.
 *
 * @param isOpen - Whether the modal is currently shown.
 * @param loadingText - Status text rendered in a live region for screen readers.
 */
export default function LoadingModal({ isOpen, loadingText }: LoadingModalProps) {
  return (
    <Dialog isOpen={isOpen} labelledBy="loading-modal-title">
      <ModalContent maxWidth="sm" className="flex flex-col items-center text-center">
        <Loader2 animate loop className="size-12 text-primary mb-4" aria-hidden="true" />
        <DialogTitle id="loading-modal-title" className="mb-2">
          Lade KI-Modelle...
        </DialogTitle>
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {loadingText}
        </p>
        <TrainingWithdrawal variant="dialog" />
      </ModalContent>
    </Dialog>
  );
}
