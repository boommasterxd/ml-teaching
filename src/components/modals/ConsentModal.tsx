/**
 * ConsentModal.tsx
 *
 * GDPR consent modal that requires the user to accept the privacy policy
 * and acknowledge external model loading before the app can proceed.
 */
import { useState } from 'react';
import Link from '../IntentLink';
import Dialog from '../Dialog';
import ModalContent from '../ModalContent';
import Button from '../Button';
import { Checkbox } from '../ui/checkbox';
import { DialogTitle } from '../ui/dialog';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '../ui/field';

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
 * Explicit consent for local image processing and external model loading.
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
    <Dialog
      initialContent
      isOpen={isOpen}
      onClose={onDecline}
      labelledBy="consent-modal-title"
      describedBy="consent-modal-desc"
    >
      <ModalContent maxWidth="lg">
        <DialogTitle id="consent-modal-title" className="mb-6">
          Einwilligung zur Datenverarbeitung
        </DialogTitle>

        <FieldSet className="mb-8">
          <FieldLegend className="sr-only">Einwilligungen</FieldLegend>
          <FieldGroup className="gap-5">
            <Field orientation="horizontal" className="items-start">
              <Checkbox
                id="privacy-consent"
                checked={privacyChecked}
                onCheckedChange={(checked) => setPrivacyChecked(checked === true)}
                className="mt-0.5"
              />
              <FieldLabel htmlFor="privacy-consent">
                <span>
                  Ich willige ein, dass ML Teaching meine ausgewählten Bilder, Kamerabilder und
                  daraus berechneten Merkmale lokal in meinem Browser zum Training und Testen
                  eigener Bildklassen verarbeitet. Weitere Informationen stehen in der{' '}
                  <Link href="/datenschutz">Datenschutzerklärung</Link>.
                </span>
              </FieldLabel>
            </Field>

            <Field orientation="horizontal" className="items-start">
              <Checkbox
                id="model-consent"
                checked={modelChecked}
                onCheckedChange={(checked) => setModelChecked(checked === true)}
                className="mt-0.5"
              />
              <FieldLabel htmlFor="model-consent">
                <span>
                  Ich willige ein, dass für die Ausführung der Anwendung notwendige KI-Modelle
                  (MobileNet) von Google-Servern geladen werden. Mir ist bewusst, dass hierbei meine
                  IP-Adresse an Google übertragen wird (siehe{' '}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Datenschutzerklärung
                    <span className="sr-only"> (öffnet in neuem Tab)</span>
                  </a>
                  ). Die Verarbeitung der aufgenommenen Bilddaten erfolgt dabei ausschließlich lokal
                  auf meinem Endgerät; es findet kein Upload von Bildmaterial statt.
                </span>
              </FieldLabel>
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldDescription id="consent-modal-desc" className="mb-6" role="note">
          Sie können Ihre Einwilligung jederzeit widerrufen. Ein Neuladen der Seite genügt.
        </FieldDescription>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button variant="secondary" onClick={onDecline} className="flex-1">
            Abbrechen
          </Button>
          <Button variant="default" onClick={onConfirm} disabled={!canConfirm} className="flex-1">
            Zustimmen
          </Button>
        </div>
      </ModalContent>
    </Dialog>
  );
}
