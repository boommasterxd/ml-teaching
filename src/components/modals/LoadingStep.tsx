import { DialogDescription, DialogFooter, DialogTitle } from '../ui/dialog';
import { Spinner } from '../ui/spinner';
import Button from '../Button';
import { RotateCcw } from '../icons/rotate-ccw';

export default function LoadingStep({
  loadingText,
  onWithdraw,
  onWithdrawIntent,
}: {
  loadingText: string;
  onWithdraw: () => void;
  onWithdrawIntent?: () => void;
}) {
  return (
    <div className="grid min-w-0 gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6">
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
      <DialogFooter layout="auto-fit">
        <Button
          variant="outline"
          onClick={onWithdraw}
          onPointerEnter={onWithdrawIntent}
          onPointerDown={onWithdrawIntent}
          onFocus={onWithdrawIntent}
        >
          <RotateCcw data-icon="inline-start" aria-hidden="true" />
          Einwilligung widerrufen
        </Button>
      </DialogFooter>
    </div>
  );
}
