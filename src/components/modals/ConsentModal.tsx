/**
 * ConsentModal.tsx
 *
 * GDPR consent modal that requires the user to accept the privacy policy
 * and acknowledge external model loading before the app can proceed.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Dialog from '../Dialog';
import ModalContent from '../ModalContent';
import Button from '../Button';

/**
 * Props for the ConsentModal component.
 */
interface ConsentModalProps {
  /** Whether the modal is currently visible. */
  isOpen: boolean;
  /** Called when the user dismisses or declines the consent dialog. */
  onDecline: () => void;
  /** Called when the user confirms both consent checkboxes and submits. */
  onConfirm: () => void;
}

/**
 * Two-checkbox consent dialog for GDPR compliance.
 *
 * Renders a modal with two required checkboxes: one for the privacy policy
 * and one for acknowledging that the MobileNet model is loaded from Google
 * servers. The confirm button is disabled until both boxes are checked.
 *
 * @param isOpen - Whether the modal is visible.
 * @param onDecline - Callback fired when the user cancels or closes the dialog.
 * @param onConfirm - Callback fired when the user submits with both boxes checked.
 */
export default function ConsentModal({ isOpen, onDecline, onConfirm }: ConsentModalProps) {
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [modelChecked, setModelChecked] = useState(false);

  // Both checkboxes must be ticked before the user can proceed.
  const canConfirm = privacyChecked && modelChecked;

  return (
    <Dialog isOpen={isOpen} onClose={onDecline} labelledBy="consent-modal-title">
      <ModalContent maxWidth="lg" className="p-8">
        <h2 id="consent-modal-title" className="text-2xl font-bold text-zinc-900 mb-6">
          Einwilligung zur Datenverarbeitung
        </h2>

        <div className="space-y-5 mb-8">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyChecked}
              onChange={(e) => setPrivacyChecked(e.target.checked)}
              className="mt-1 w-5 h-5 flex-shrink-0 rounded border-zinc-500 text-indigo-600 focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            />
            <span className="text-zinc-700 text-sm leading-relaxed">
              Ich habe die{' '}
              <Link to="/datenschutz" className="text-indigo-600 hover:underline font-medium">
                Datenschutzerklärung
              </Link>{' '}
              zur Kenntnis genommen und stimme der Verarbeitung meiner Daten gemäß den dort beschriebenen Bedingungen zu.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={modelChecked}
              onChange={(e) => setModelChecked(e.target.checked)}
              className="mt-1 w-5 h-5 flex-shrink-0 rounded border-zinc-500 text-indigo-600 focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            />
            <span className="text-zinc-700 text-sm leading-relaxed">
              Ich willige ein, dass für die Ausführung der Anwendung notwendige KI-Modelle (MobileNet) von Google-Servern
              geladen werden. Mir ist bewusst, dass hierbei meine IP-Adresse an Google übertragen wird (siehe{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline font-medium"
              >
                Google Datenschutzerklärung<span className="sr-only"> (öffnet in neuem Tab)</span>
              </a>
              ). Die Verarbeitung der aufgenommenen Bilddaten erfolgt dabei ausschließlich lokal auf meinem Endgerät; es
              findet kein Upload von Bildmaterial statt.
            </span>
          </label>
        </div>

        <p className="text-sm text-zinc-500 mb-6" role="note">
          Sie können Ihre Einwilligung jederzeit widerrufen. Ein Neuladen der Seite genügt.
        </p>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onDecline} className="flex-1">
            Abbrechen
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={!canConfirm} className="flex-1">
            Zustimmen
          </Button>
        </div>
      </ModalContent>
    </Dialog>
  );
}
