import { useEffect, useRef } from 'react';
import { AlertCircle } from './icons/alert-circle';
import Button from './Button';
import { Alert, AlertDescription } from './ui/alert';

/** Model failures remain reachable after the loading dialog closes. */
export default function TrainingError({
  message,
  onReturn,
}: {
  message: string;
  onReturn: () => void;
}) {
  const alertRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    alertRef.current?.focus();
  }, []);
  return (
    <div className="mt-6">
      <Alert ref={alertRef} tabIndex={-1} variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertDescription>
          <p>{message}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button onClick={() => window.location.reload()}>Seite neu laden</Button>
            <Button variant="secondary" onClick={onReturn}>
              Zur Bilderkennung
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
