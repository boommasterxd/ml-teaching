'use client';
import Button from '@/components/Button';

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
      <p>Bitte versuche es erneut.</p>
      <Button onClick={reset}>Erneut versuchen</Button>
    </div>
  );
}
