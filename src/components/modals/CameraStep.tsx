import { AlertCircle } from '../icons/alert-circle';
import { Camera } from '../icons/camera';
import Button from '../Button';
import { DialogBody, DialogDescription, DialogFooter, DialogTitle } from '../ui/dialog';
import { Spinner } from '../ui/spinner';

interface CameraStepProps {
  onDecline: () => void;
  onConfirm: () => void;
  pending?: boolean;
  error?: string;
  onRetry?: () => void;
}

export default function CameraStep({
  onDecline,
  onConfirm,
  pending,
  error,
  onRetry,
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
          Die Kamera ist optional. Nach Ihrer Freigabe startet sie beim Sammeln von Trainingsbildern
          und in der Live-Vorhersage automatisch. Für das Training können Sie auch Bilder von Ihrem
          Gerät auswählen.{' '}
          <strong>
            Die erfassten Bilddaten werden ausschließlich lokal im Browser verarbeitet und zu keinem
            Zeitpunkt an externe Server übermittelt oder dort gespeichert.
          </strong>
        </DialogDescription>
        <p role="status" className="sr-only">
          {pending ? 'Warte auf die Kamerafreigabe im Browser …' : null}
        </p>
        {error && !pending && (
          <p role="alert" className="mt-5 flex items-start gap-2">
            <AlertCircle aria-hidden="true" className="mt-1 size-4 shrink-0 text-destructive" />
            {error}
          </p>
        )}
      </DialogBody>
      <DialogFooter
        layout="auto-fit"
        className="[&>button]:h-auto [&>button]:min-h-9 [&>button]:whitespace-normal"
      >
        <Button variant="secondary" onClick={onDecline}>
          Ohne Kamera fortfahren
        </Button>
        <Button variant="default" onClick={error ? onRetry : onConfirm} disabled={pending}>
          {pending ? (
            <Spinner data-icon="inline-start" aria-hidden="true" />
          ) : (
            <Camera data-icon="inline-start" aria-hidden="true" />
          )}
          {error ? 'Erneut versuchen' : 'Erlauben'}
        </Button>
      </DialogFooter>
    </>
  );
}
