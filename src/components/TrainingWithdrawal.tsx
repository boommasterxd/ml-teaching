import { RotateCcw } from './icons/rotate-ccw';
import Button from './Button';
import { Text } from './ui/typography';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { EntryReveal } from './ui/entry-reveal';

/** A native document reload retires the complete in-memory workspace and renews consent. */
export default function TrainingWithdrawal({
  variant = 'workspace',
}: {
  variant?: 'workspace' | 'dialog';
}) {
  const workspace = variant === 'workspace';
  return (
    <EntryReveal kind="text" asChild>
      <div className={workspace ? 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10' : 'mt-6'}>
        {workspace && <Separator />}
        <div
          className={cn(
            'flex flex-col gap-3',
            workspace
              ? 'pt-6 items-start sm:flex-row sm:items-center sm:justify-between'
              : 'items-center',
          )}
        >
          <Button asChild variant="outline">
            <a
              href="/lernen"
              aria-label="Einwilligung widerrufen und lokale Trainingsdaten verwerfen"
            >
              <RotateCcw data-icon="inline-start" aria-hidden="true" />
              Einwilligung widerrufen
            </a>
          </Button>
          <Text variant="muted">Lädt die Lernseite neu und verwirft deine Trainingsdaten.</Text>
        </div>
      </div>
    </EntryReveal>
  );
}
