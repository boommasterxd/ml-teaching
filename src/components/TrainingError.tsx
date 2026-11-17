import { useEffect, useRef } from 'react';
import { AlertCircle } from './icons/alert-circle';
import Button from './Button';
import type { AppError } from '../types/errors';
import { Alert, AlertDescription } from './ui/alert';

/** Model failures remain reachable after the loading dialog closes. */
export default function TrainingError({
  error,
  onReturn,
}: {
  error: AppError;
  onReturn: () => void;
}) {
  const alertRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error.category === 'model') alertRef.current?.focus();
  }, [error.category]);
  return (
    <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 lg:px-8">
      <Alert ref={alertRef} tabIndex={-1} variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertDescription>
          <p>{error.message}</p>
          {error.category === 'model' && (
            <div className="mt-3 flex flex-wrap gap-3">
              <Button onClick={() => window.location.reload()}>Seite neu laden</Button>
              <Button variant="secondary" onClick={onReturn}>
                Zur Bilderkennung
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
