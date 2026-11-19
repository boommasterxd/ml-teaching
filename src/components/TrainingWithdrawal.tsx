import { RotateCcw } from './icons/rotate-ccw';
import Button from './Button';
import { Text } from './ui/typography';
import { EntryReveal } from './ui/entry-reveal';
import { learningPaths } from '@/lib/learning-paths';
import { cn } from '@/lib/utils';

/** A native document reload retires the complete in-memory workspace and renews consent. */
export default function TrainingWithdrawal({
  variant = 'workspace',
  visible = true,
}: {
  variant?: 'workspace' | 'dialog';
  visible?: boolean;
}) {
  const action = (
    <Button
      variant="outline"
      render={
        <a
          href={learningPaths.imagePractice}
          aria-label="Einwilligung widerrufen und lokale Trainingsdaten verwerfen"
        />
      }
    >
      <RotateCcw data-icon="inline-start" aria-hidden="true" />
      Einwilligung widerrufen
    </Button>
  );
  if (variant === 'dialog') return action;
  return (
    <EntryReveal kind="text" asChild active={visible} scrollOnly>
      <div
        aria-hidden={!visible || undefined}
        className={cn(
          'mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center',
          !visible && 'invisible',
        )}
      >
        {action}
        <Text variant="muted">Lädt die Lernseite neu und verwirft deine Trainingsdaten.</Text>
      </div>
    </EntryReveal>
  );
}
