import { Camera } from '../icons/camera';
import Button from '../Button';
import { DialogDescription, DialogFooter, DialogTitle } from '../ui/dialog';

interface CameraStepProps {
  onDecline: () => void;
  onConfirm: () => void;
}

export default function CameraStep({ onDecline, onConfirm }: CameraStepProps) {
  return (
    <>
      <DialogTitle
        id="camera-modal-title"
        tabIndex={-1}
        className="text-balance text-2xl leading-tight tracking-tight"
      >
        Berechtigung zur Kameranutzung
      </DialogTitle>
      <DialogDescription id="camera-modal-desc" className="leading-relaxed">
        Die Kamera ist optional. Sie können Trainingsbilder mit der Kamera aufnehmen oder ohne
        Kamerazugriff vorhandene Bilder von Ihrem Gerät auswählen.{' '}
        <strong>
          Die erfassten Bilddaten werden ausschließlich lokal im Browser verarbeitet und zu keinem
          Zeitpunkt an externe Server übermittelt oder dort gespeichert.
        </strong>
      </DialogDescription>
      <DialogFooter>
        <Button variant="secondary" onClick={onDecline}>
          Ohne Kamera fortfahren
        </Button>
        <Button variant="default" onClick={onConfirm}>
          <Camera data-icon="inline-start" aria-hidden="true" /> Erlauben
        </Button>
      </DialogFooter>
    </>
  );
}
