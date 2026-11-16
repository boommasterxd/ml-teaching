/**
 * LoadingModal.tsx
 *
 * Non-dismissible modal shown while ML models (MobileNet + KNN) are being
 * downloaded and initialized. Blocks user interaction until loading completes.
 */
import { Loader2 } from '../icons';
import Dialog from '../Dialog';
import ModalContent from '../ModalContent';
import { DialogTitle } from '../ui/dialog';

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
 * The modal cannot be dismissed by the user.
 *
 * @param isOpen - Whether the modal is currently shown.
 * @param loadingText - Status text rendered in a live region for screen readers.
 */
export default function LoadingModal({ isOpen, loadingText }: LoadingModalProps) {
  return (
    <Dialog isOpen={isOpen} labelledBy="loading-modal-title">
      <ModalContent maxWidth="sm" className="p-6 sm:p-8 flex flex-col items-center text-center">
        <Loader2 animate loop className="size-12 text-primary mb-4" aria-hidden="true" />
        <DialogTitle id="loading-modal-title" className="mb-2">
          Lade KI-Modelle...
        </DialogTitle>
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {loadingText}
        </p>
      </ModalContent>
    </Dialog>
  );
}
