/**
 * Non-dismissible modal shown while ML models are being downloaded and initialized.
 */
import { Loader2 } from 'lucide-react';
import Dialog from '../Dialog';
import ModalContent from '../ModalContent';

interface LoadingModalProps {
  isOpen: boolean;
  loadingText: string;
}

/** Displays a spinner and progress text while models load. Cannot be closed by the user. */
export default function LoadingModal({ isOpen, loadingText }: LoadingModalProps) {
  return (
    <Dialog isOpen={isOpen} labelledBy="loading-modal-title">
      <ModalContent maxWidth="sm" className="p-8 flex flex-col items-center text-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" aria-hidden="true" />
        <h2 id="loading-modal-title" className="text-xl font-bold text-zinc-900 mb-2">
          Lade KI-Modelle...
        </h2>
        <p className="text-zinc-600 text-sm" aria-live="polite">
          {loadingText}
        </p>
      </ModalContent>
    </Dialog>
  );
}
