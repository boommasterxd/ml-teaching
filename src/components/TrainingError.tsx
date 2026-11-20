import { useEffect, useRef } from 'react';
import { AlertCircle } from './icons/alert-circle';
import Button from './Button';
import { Alert, AlertDescription } from './ui/alert';

/** Keeps recovery available after a model or camera request fails. */
export default function TrainingError({
  message,
  onReturn,
  onReturnIntent,
}: {
  message: string;
  onReturn?: () => void;
  onReturnIntent?: () => void;
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
            <Button className="min-h-11" onClick={() => window.location.reload()}>
              Seite neu laden
            </Button>
            {onReturn && (
              <Button
                variant="secondary"
                onPointerEnter={onReturnIntent}
                onFocus={onReturnIntent}
                onPointerDown={onReturnIntent}
                onClick={onReturn}
              >
                Zur Bilderkennung
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
