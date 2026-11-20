import { DialogDescription, DialogFooter, DialogTitle } from '../ui/dialog';
import { Spinner } from '../ui/spinner';
import TrainingWithdrawal from '../TrainingWithdrawal';

export default function LoadingStep({ loadingText }: { loadingText: string }) {
  return (
    <>
      <div className="grid min-w-0 gap-2">
        <DialogTitle
          id="loading-modal-title"
          tabIndex={-1}
          icon={<Spinner aria-hidden="true" className="text-primary" />}
        >
          Lade KI-Modelle...
        </DialogTitle>
        <DialogDescription id="loading-modal-desc" aria-live="polite">
          {loadingText}
        </DialogDescription>
      </div>
      <DialogFooter className="grid-cols-1 sm:justify-items-end">
        <TrainingWithdrawal />
      </DialogFooter>
    </>
  );
}
