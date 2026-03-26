import { Camera } from 'lucide-react';
import Dialog from '../Dialog';
import Button from '../Button';

interface CameraConsentModalProps {
  isOpen: boolean;
  onDecline: () => void;
  onConfirm: () => void;
}

export default function CameraConsentModal({ isOpen, onDecline, onConfirm }: CameraConsentModalProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onDecline} labelledBy="camera-modal-title">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-fit max-w-md w-full p-8 text-center">
        <div
          className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6"
          aria-hidden="true"
        >
          <Camera className="w-8 h-8" />
        </div>
        <h2 id="camera-modal-title" className="text-2xl font-bold text-zinc-900 mb-4">
          Berechtigung zur Kameranutzung
        </h2>
        <p className="text-zinc-600 mb-8 text-sm leading-relaxed">
          Für die Erfassung von Trainingsdaten benötigt diese Anwendung Zugriff auf die Kamera Ihres Endgeräts.{' '}
          <strong>
            Die erfassten Bilddaten werden ausschließlich lokal im Browser verarbeitet und zu keinem Zeitpunkt an externe
            Server übermittelt oder dort gespeichert.
          </strong>
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onDecline} className="flex-1">
            Abbrechen
          </Button>
          <Button variant="primary" onClick={onConfirm} className="flex-1">
            <Camera className="w-5 h-5 mr-2" aria-hidden="true" /> Erlauben
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
