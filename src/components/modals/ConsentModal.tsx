/**
 * GDPR consent modal that requires the user to accept the privacy policy
 * and acknowledge external model loading before the app can proceed.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Dialog from '../Dialog';
import Button from '../Button';

interface ConsentModalProps {
  isOpen: boolean;
  onDecline: () => void;
  onConfirm: () => void;
}

/** Two-checkbox consent dialog; confirm is only enabled when both boxes are checked. */
export default function ConsentModal({ isOpen, onDecline, onConfirm }: ConsentModalProps) {
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [modelChecked, setModelChecked] = useState(false);

  const canConfirm = privacyChecked && modelChecked;

  return (
    <Dialog isOpen={isOpen} onClose={onDecline} labelledBy="consent-modal-title">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-fit max-w-lg w-full p-8">
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

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onDecline} className="flex-1">
            Abbrechen
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={!canConfirm} className="flex-1">
            Zustimmen
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
