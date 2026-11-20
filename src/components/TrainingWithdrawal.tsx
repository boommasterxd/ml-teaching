import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw } from './icons/rotate-ccw';
import Button from './Button';
import { learningPaths } from '@/lib/learning-paths';

const withdrawalLabel = 'Einwilligung widerrufen und lokale Trainingsdaten verwerfen';
// The persistent site shell always provides the same slot for this document.
const subscribeToFooter = () => () => {};
const getFooterSlot = () => document.getElementById('footer-route-actions');
const getServerSlot = () => null;

export function TrainingFooterWithdrawal() {
  const slot = useSyncExternalStore(subscribeToFooter, getFooterSlot, getServerSlot);
  return slot
    ? createPortal(
        <a
          href={learningPaths.imagePractice}
          aria-label={withdrawalLabel}
          className="footer-link inline-flex min-h-6 items-center text-sm"
        >
          Einwilligung widerrufen
        </a>,
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
