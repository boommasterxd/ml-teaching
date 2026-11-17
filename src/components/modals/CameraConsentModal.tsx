/**
 * CameraConsentModal.tsx
 *
 * Modal dialog that asks the user for camera access permission before activating the webcam.
 * Informs the user that all captured image data is processed locally and never transmitted
 * to external servers. Exports the `CameraConsentModal` component as default.
 */
import { Camera } from '../icons/camera';
import Dialog from '../Dialog';
import ModalContent from '../ModalContent';
import Button from '../Button';
import { DialogTitle } from '../ui/dialog';

/**
 * Props for the CameraConsentModal component.
 */
interface CameraConsentModalProps {
  /** Whether the modal is currently visible. */
  isOpen: boolean;
  /** Called when the user dismisses the modal without granting camera access. */
  onDecline: () => void;
  /** Called when the user grants camera access permission. */
  onConfirm: () => void;
}

/**
 * Displays a camera permission prompt with a privacy notice and cancel/allow actions.
 *
 * @param isOpen - Controls modal visibility.
 * @param onDecline - Handler invoked when the user cancels.
 * @param onConfirm - Handler invoked when the user grants camera access.
 */
export default function CameraConsentModal({
  isOpen,
  onDecline,
  onConfirm,
}: CameraConsentModalProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onDecline}
      labelledBy="camera-modal-title"
      describedBy="camera-modal-desc"
    >
      <ModalContent maxWidth="md">
        <div
          className="size-12 bg-primary-soft text-primary rounded-xl flex items-center justify-center mb-6"
          aria-hidden="true"
        >
          <Camera className="size-6" />
        </div>
        <DialogTitle id="camera-modal-title" className="mb-4">
          Berechtigung zur Kameranutzung
        </DialogTitle>
        <p id="camera-modal-desc" className="text-muted-foreground mb-8 text-sm leading-relaxed">
          Die Kamera ist optional. Sie können Trainingsbilder mit der Kamera aufnehmen oder ohne
          Kamerazugriff vorhandene Bilder von Ihrem Gerät auswählen.{' '}
          <strong>
            Die erfassten Bilddaten werden ausschließlich lokal im Browser verarbeitet und zu keinem
            Zeitpunkt an externe Server übermittelt oder dort gespeichert.
          </strong>
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button variant="secondary" onClick={onDecline} className="flex-1">
            Ohne Kamera fortfahren
          </Button>
          <Button variant="default" onClick={onConfirm} className="flex-1">
            <Camera data-icon="inline-start" aria-hidden="true" /> Erlauben
          </Button>
        </div>
      </ModalContent>
    </Dialog>
  );
}
