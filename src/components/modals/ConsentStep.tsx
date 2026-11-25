import { useState, type ReactNode } from 'react';
import Link from '../IntentLink';
import Button from '../Button';
import { Checkbox } from '../ui/checkbox';
import { DialogBody, DialogDescription, DialogFooter, DialogTitle } from '../ui/dialog';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '../ui/field';

interface ConsentStepProps {
  declineAction: ReactNode;
  onConfirmIntent?: () => void;
  onConfirm: (remember: boolean) => void;
}

function ConsentActions({
  declineAction,
  onConfirmIntent,
  onConfirm,
  canConfirm,
}: Pick<ConsentStepProps, 'declineAction' | 'onConfirmIntent'> & {
  canConfirm: boolean;
  onConfirm: () => void;
}) {
  const prepare = canConfirm ? onConfirmIntent : undefined;
  return (
    <DialogFooter layout="auto-fit">
      {declineAction}
      <Button
        variant="default"
        onPointerEnter={prepare}
        onFocus={prepare}
        onPointerDown={prepare}
        onClick={onConfirm}
        disabled={!canConfirm}
      >
        Zustimmen
      </Button>
    </DialogFooter>
  );
}

export default function ConsentStep({
  declineAction,
  onConfirmIntent,
  onConfirm,
}: ConsentStepProps) {
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

      <DialogBody className="py-0.5">
        <DialogDescription id="consent-modal-desc" className="mb-2">
          Du kannst deine Einwilligung während der Einrichtung und in den Einstellungen zum
          Bildtraining widerrufen.
        </DialogDescription>
        <FieldSet className="min-w-0">
          <FieldLegend className="sr-only">Einwilligungen</FieldLegend>
          <FieldGroup className="gap-0 divide-y divide-border">
            <Field orientation="horizontal" className="items-start gap-2.5 py-2 sm:gap-3 sm:py-3">
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
                  Beim Lernen und Testen bleiben Bilder und daraus gewonnene Daten in meinem
                  Browser. Über die Kamera entscheide ich extra. Mehr in der{' '}
                  <Link href="/datenschutz">Datenschutzerklärung</Link>.
                </span>
              </FieldLabel>
            </Field>

            <Field orientation="horizontal" className="items-start gap-2.5 py-2 sm:gap-3 sm:py-3">
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
                  Ich stimme zu, dass mein Browser das KI-Modell lädt. Google und Kaggle erhalten
                  dabei meine IP-Adresse.
                </span>
              </FieldLabel>
            </Field>
            <Field orientation="horizontal" className="items-start gap-2.5 py-2 sm:gap-3 sm:py-3">
              <Checkbox
                id="remember-training-consent"
                aria-labelledby="remember-training-consent-label"
                aria-describedby="remember-training-consent-description"
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked === true)}
                className="mt-0.5 size-5"
              />
              <FieldLabel
                htmlFor="remember-training-consent"
                className="grid min-w-0 cursor-pointer gap-1 font-normal"
              >
                <span id="remember-training-consent-label">
                  Für 30 Minuten in diesem Tab merken
                </span>
                <FieldDescription id="remember-training-consent-description" render={<span />}>
                  Deine Auswahl gilt bis zu 30 Minuten, solange du im selben Tab auf der Website
                  bleibst und sie nicht neu lädst. Wenn du die Kamera erlaubst und dein Browser sie
                  weiterhin freigibt, kann sie beim erneuten Trainingsstart automatisch angehen.
                </FieldDescription>
              </FieldLabel>
            </Field>
          </FieldGroup>
        </FieldSet>
      </DialogBody>

      <ConsentActions
        declineAction={declineAction}
        canConfirm={canConfirm}
        onConfirmIntent={onConfirmIntent}
        onConfirm={() => onConfirm(remember)}
      />
    </>
  );
}
