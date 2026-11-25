import type { ReactNode } from 'react';
import { AlertCircle } from '../icons/alert-circle';
import Button from '../Button';
import { Alert, AlertDescription } from '../ui/alert';
import { DialogBody, DialogDescription, DialogTitle } from '../ui/dialog';
import { Spinner } from '../ui/spinner';
import SetupActionFooter from './SetupActionFooter';

interface CameraStepProps {
  onDecline: () => void;
  onConfirm: () => void;
  pending?: boolean;
  error?: string;
  onRetry?: () => void;
  withdrawAction: ReactNode;
}

export default function CameraStep({
  onDecline,
  onConfirm,
  pending,
  error,
  onRetry,
  withdrawAction,
}: CameraStepProps) {
  return (
    <>
      <DialogTitle
        id="camera-modal-title"
        tabIndex={-1}
        className="text-balance text-2xl leading-tight tracking-tight"
      >
        Berechtigung zur Kameranutzung
      </DialogTitle>
      <DialogBody tabIndex={0} role="region" aria-labelledby="camera-modal-title">
        <DialogDescription id="camera-modal-desc" className="leading-relaxed">
          Die Kamera ist optional. Wenn Sie „Erlauben“ wählen, kann die Kamera schon während der
          Einrichtung starten, sobald Ihr Browser den Zugriff freigibt. Beim Sammeln von Bildern und
          bei der Live-Vorhersage kann sie automatisch wieder starten. Sie können auch Bilder von
          Ihrem Gerät auswählen.{' '}
          <strong>
            Die erfassten Bilddaten werden ausschließlich lokal im Browser verarbeitet und zu keinem
            Zeitpunkt an externe Server übermittelt oder dort gespeichert.
          </strong>
        </DialogDescription>
        <p role="status" className="sr-only">
          {pending ? 'Warte auf die Kamerafreigabe im Browser …' : null}
        </p>
        {error && !pending && (
          <Alert variant="destructive" className="mt-5">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </DialogBody>
      <SetupActionFooter stacked={Boolean(error)}>
        <Button variant="secondary" onClick={onDecline}>
          <span className="min-w-0">Ohne Kamera fortfahren</span>
        </Button>
        {withdrawAction}
        <Button
          variant="default"
          onClick={error ? onRetry : onConfirm}
          disabled={pending}
          focusableWhenDisabled
          className="aria-disabled:cursor-default aria-disabled:opacity-50 aria-disabled:hover:bg-primary aria-disabled:focus-visible:opacity-100"
        >
          {pending && <Spinner data-icon="inline-start" aria-hidden="true" />}
          <span className="min-w-0">{error ? 'Erneut versuchen' : 'Erlauben'}</span>
        </Button>
      </SetupActionFooter>
    </>
  );
}
