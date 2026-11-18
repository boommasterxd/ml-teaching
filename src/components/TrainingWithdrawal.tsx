import { RotateCcw } from './icons/rotate-ccw';
import Button from './Button';
import { Text } from './ui/typography';
import { EntryReveal } from './ui/entry-reveal';
import { learningPaths } from '@/lib/learning-paths';

/** A native document reload retires the complete in-memory workspace and renews consent. */
export default function TrainingWithdrawal({
  variant = 'workspace',
}: {
  variant?: 'workspace' | 'dialog';
}) {
  const action = (
    <Button asChild variant="outline">
      <a
        href={learningPaths.imagePractice}
        aria-label="Einwilligung widerrufen und lokale Trainingsdaten verwerfen"
      >
        <RotateCcw data-icon="inline-start" aria-hidden="true" />
        Einwilligung widerrufen
      </a>
    </Button>
  );
  if (variant === 'dialog') return action;
  return (
    <EntryReveal kind="text" asChild>
      <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        {action}
        <Text variant="muted">Lädt die Lernseite neu und verwirft deine Trainingsdaten.</Text>
      </div>
    </EntryReveal>
  );
}
