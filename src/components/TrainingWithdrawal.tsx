import { useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw } from './icons/rotate-ccw';
import Button from './Button';
import { learningPaths } from '@/lib/learning-paths';

const withdrawalLabel = 'Einwilligung widerrufen und lokale Trainingsdaten verwerfen';
// The persistent site shell always provides the same slot for this document.
const subscribeToFooter = () => () => {};
const getFooterSlot = () => document.getElementById('footer-route-actions');
const getServerSlot = () => null;

export function TrainingFooterWithdrawal({ onRevokeCamera }: { onRevokeCamera?: () => void }) {
  const slot = useSyncExternalStore(subscribeToFooter, getFooterSlot, getServerSlot);
  const withdrawal = useRef<HTMLAnchorElement>(null);
  return slot
    ? createPortal(
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {onRevokeCamera && (
            <Button
              variant="ghost"
              size="sm"
              className="footer-link min-h-11 px-0 font-normal hover:bg-transparent"
              onClick={(event) => {
                if (document.activeElement === event.currentTarget)
                  withdrawal.current?.focus({ preventScroll: true });
                onRevokeCamera();
              }}
            >
              Kamera ausschalten
            </Button>
          )}
          <a
            ref={withdrawal}
            href={learningPaths.imagePractice}
            aria-label={withdrawalLabel}
            className="footer-link inline-flex min-h-6 items-center text-sm"
          >
            Einwilligung widerrufen
          </a>
        </div>,
        slot,
      )
    : null;
}

/** A native document reload retires the complete in-memory workspace and renews consent. */
export default function TrainingWithdrawal() {
  return (
    <Button
      variant="outline"
      render={<a href={learningPaths.imagePractice} aria-label={withdrawalLabel} />}
    >
      <RotateCcw data-icon="inline-start" aria-hidden="true" />
      Einwilligung widerrufen
    </Button>
  );
}
