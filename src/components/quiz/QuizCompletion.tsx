'use client';

import { CheckCircle2 } from '@/components/icons/check-circle2';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { AnimatedFeedback } from '@/components/ui/animated-feedback';

export default function QuizCompletion() {
  return (
    <AnimatedFeedback>
      <Alert variant="success" role="presentation">
        <CheckCircle2 aria-hidden="true" />
        <AlertTitle>
          <h3>Alle drei gefunden.</h3>
        </AlertTitle>
      </Alert>
    </AnimatedFeedback>
  );
}
