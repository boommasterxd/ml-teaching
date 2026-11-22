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
  onDeclineIntent?: () => void;
  onConfirm: (remember: boolean) => void;
}

export default function ConsentStep({ onDecline, onDeclineIntent, onConfirm }: ConsentStepProps) {
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [modelChecked, setModelChecked] = useState(false);
  const [remember, setRemember] = useState(false);

  const canConfirm = privacyChecked && modelChecked;

  return (
    <>
      <DialogTitle
        id="consent-modal-title"
        tabIndex={-1}
        className="text-xl leading-tight tracking-tight sm:text-3xl sm:text-balance"
      >
        Einwilligung zur Datenverarbeitung
      </DialogTitle>

      <FieldSet className="min-w-0">
        <FieldLegend className="sr-only">Einwilligungen</FieldLegend>
        <FieldGroup className="gap-0 divide-y divide-border sm:rounded-2xl sm:border sm:border-border sm:bg-background/40 sm:px-5">
          <Field orientation="horizontal" className="items-start gap-2.5 py-2 sm:gap-3 sm:py-4">
            <Checkbox
              id="privacy-consent"
              checked={privacyChecked}
              onCheckedChange={(checked) => setPrivacyChecked(checked === true)}
              className="mt-0.5 size-5"
            />
            <FieldLabel
              htmlFor="privacy-consent"
              className="min-w-0 leading-normal font-normal [overflow-wrap:anywhere] sm:leading-relaxed"
            >
              <span>
                Ich stimme zu, dass ML Teaching mit meinen Bildern lernt, Motive zu unterscheiden.
                Beim Lernen und Testen bleiben Bilder und daraus gewonnene Daten in meinem Browser.
                Über die Kamera entscheide ich extra. Mehr in der{' '}
                <Link href="/datenschutz">Datenschutzerklärung</Link>.
              </span>
            </FieldLabel>
          </Field>

          <Field orientation="horizontal" className="items-start gap-2.5 py-2 sm:gap-3 sm:py-4">
            <Checkbox
              id="model-consent"
              checked={modelChecked}
              onCheckedChange={(checked) => setModelChecked(checked === true)}
              className="mt-0.5 size-5"
            />
            <FieldLabel
              htmlFor="model-consent"
              className="min-w-0 leading-normal font-normal [overflow-wrap:anywhere] sm:leading-relaxed"
            >
              <span>
                Ich stimme zu, dass mein Browser das KI-Modell von Google über Kaggle lädt, damit
                ich die Bilderkennung ausprobieren kann. Dabei erfahren Google und Kaggle meine
                IP-Adresse (meine Internetadresse), welchen Browser ich nutze und wann ich das
                Modell abrufe. Mehr in der <Link href="/datenschutz">Datenschutzerklärung</Link>.
              </span>
            </FieldLabel>
          </Field>
          <Field orientation="horizontal" className="gap-2.5 py-2 sm:gap-3 sm:py-4">
            <Checkbox
              id="remember-training-consent"
              checked={remember}
              onCheckedChange={(checked) => setRemember(checked === true)}
              className="size-5"
            />
            <FieldLabel
              htmlFor="remember-training-consent"
              className="relative top-[0.75px] min-w-0 font-normal"
            >
              Für 30 Minuten in diesem Tab merken
            </FieldLabel>
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldDescription id="consent-modal-desc" role="note">
        Auch ohne Zustimmung kannst du über Bilderkennung lesen. Du kannst sie beim Laden des
        Modells und in den Einstellungen zum Bildtraining widerrufen.
      </FieldDescription>

      <DialogFooter layout="auto-fit">
        <Button
          variant="secondary"
          onPointerEnter={onDeclineIntent}
          onFocus={onDeclineIntent}
          onPointerDown={onDeclineIntent}
          onClick={onDecline}
        >
          Abbrechen
        </Button>
        <Button variant="default" onClick={() => onConfirm(remember)} disabled={!canConfirm}>
          Zustimmen
        </Button>
      </DialogFooter>
    </>
  );
}
