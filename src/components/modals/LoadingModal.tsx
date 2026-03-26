import { Loader2 } from 'lucide-react';
import Dialog from '../Dialog';

interface LoadingModalProps {
  isOpen: boolean;
  loadingText: string;
}

export default function LoadingModal({ isOpen, loadingText }: LoadingModalProps) {
  return (
    // Kein onClose — das Laden kann nicht vom Nutzer abgebrochen werden
    <Dialog isOpen={isOpen} labelledBy="loading-modal-title">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-fit max-w-sm w-full p-8 flex flex-col items-center text-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" aria-hidden="true" />
        <h2 id="loading-modal-title" className="text-xl font-bold text-zinc-900 mb-2">
          Lade KI-Modelle...
        </h2>
        <p className="text-zinc-600 text-sm" aria-live="polite">
          {loadingText}
        </p>
      </div>
    </Dialog>
  );
}
