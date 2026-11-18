import { useState } from 'react';
import Link from '../IntentLink';
import Button from '../Button';
import { Checkbox } from '../ui/checkbox';
import { DialogFooter, DialogTitle } from '../ui/dialog';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '../ui/field';

interface ConsentStepProps {
  onDecline: () => void;
  onConfirm: () => void;
}

export default function ConsentStep({ onDecline, onConfirm }: ConsentStepProps) {
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [modelChecked, setModelChecked] = useState(false);

  const canConfirm = privacyChecked && modelChecked;

  return (
    <>
      <DialogTitle
        id="consent-modal-title"
        tabIndex={-1}
        className="text-balance text-2xl leading-tight tracking-tight sm:text-3xl"
      >
        Einwilligung zur Datenverarbeitung
      </DialogTitle>

      <FieldSet className="min-w-0">
        <FieldLegend className="sr-only">Einwilligungen</FieldLegend>
        <FieldGroup className="gap-0 divide-y divide-border rounded-2xl border border-border bg-background/40 px-4 sm:px-5">
          <Field orientation="horizontal" className="items-start py-4">
            <Checkbox
              id="privacy-consent"
              checked={privacyChecked}
              onCheckedChange={(checked) => setPrivacyChecked(checked === true)}
              className="mt-0.5 size-5"
            />
            <FieldLabel
              htmlFor="privacy-consent"
              className="min-w-0 leading-relaxed font-normal [overflow-wrap:anywhere]"
            >
              <span>
                Ich willige ein, dass ML Teaching meine ausgewählten Bilder, Kamerabilder und daraus
                berechneten Merkmale lokal in meinem Browser zum Training und Testen eigener
                Bildklassen verarbeitet. Weitere Informationen stehen in der{' '}
                <Link href="/datenschutz">Datenschutzerklärung</Link>.
              </span>
            </FieldLabel>
          </Field>

          <Field orientation="horizontal" className="items-start py-4">
            <Checkbox
              id="model-consent"
              checked={modelChecked}
              onCheckedChange={(checked) => setModelChecked(checked === true)}
              className="mt-0.5 size-5"
            />
            <FieldLabel
              htmlFor="model-consent"
              className="min-w-0 leading-relaxed font-normal [overflow-wrap:anywhere]"
            >
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
                auf deinem Endgerät; es findet kein Upload von Bildmaterial statt.
              </span>
            </FieldLabel>
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldDescription id="consent-modal-desc" role="note">
        Sie können Ihre Einwilligung jederzeit widerrufen. Ein Neuladen der Seite genügt.
      </FieldDescription>

      <DialogFooter layout="auto-fit">
        <Button variant="secondary" onClick={onDecline}>
          Abbrechen
        </Button>
        <Button variant="default" onClick={onConfirm} disabled={!canConfirm}>
          Zustimmen
        </Button>
      </DialogFooter>
    </>
  );
}
