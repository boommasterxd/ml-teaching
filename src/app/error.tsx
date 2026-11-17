'use client';
import Button from '@/components/Button';
import { EntryReveal } from '@/components/ui/entry-reveal';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-6 text-center"
    >
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Diese Seite konnte nicht geladen werden
      </h1>
      <EntryReveal kind="text">
        <div className="flex flex-col items-center gap-6">
          <p>Bitte versuche es erneut.</p>
          <Button onClick={reset}>Erneut versuchen</Button>
        </div>
      </EntryReveal>
    </div>
  );
}
