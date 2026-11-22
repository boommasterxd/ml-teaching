import { DialogBody, DialogDescription, DialogFooter, DialogTitle } from '../ui/dialog';
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
    <div className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:grid-rows-1 sm:items-center sm:gap-6">
      <div className="flex max-h-full min-w-0 flex-col gap-2">
        <DialogTitle
          id="loading-modal-title"
          tabIndex={-1}
          icon={<Spinner aria-hidden="true" className="text-primary" />}
        >
          Lade KI-Modelle...
        </DialogTitle>
        <DialogBody tabIndex={0} role="region" aria-labelledby="loading-modal-title">
          <DialogDescription id="loading-modal-desc" aria-live="polite">
            {loadingText}
          </DialogDescription>
        </DialogBody>
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
