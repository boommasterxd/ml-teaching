'use client';

import { useIsPresent } from 'motion/react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import { CheckCircle2 } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function QuizCompletion() {
  const reduce = useShouldReduceMotion();
  const present = useIsPresent();
  return (
    <Effect
      slide={reduce ? false : { direction: 'up', offset: 8 }}
      aria-hidden={present ? undefined : true}
      inert={!present || undefined}
    >
      <Alert variant="success" role="presentation">
        <CheckCircle2 aria-hidden="true" />
        <AlertTitle>
          <h3>Alle drei gefunden.</h3>
        </AlertTitle>
        <AlertDescription>
          Du kannst die übrigen Beispiele weiter prüfen oder neu starten.
        </AlertDescription>
      </Alert>
    </Effect>
  );
}
