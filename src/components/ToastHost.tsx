'use client';

import { useEffect, useState, useSyncExternalStore, type ComponentType } from 'react';
import { getInitialToasts, getPendingToasts, subscribeToPendingToasts, toast } from '@/lib/toast';
import { Alert, AlertDescription } from './ui/alert';
import Button from './Button';
import { X } from './icons/x';
import { loadToaster } from './toast-loader';
import './ui/toast.css';

/** Only load the viewport after an action produces a notification. */
export default function ToastHost() {
  const pending = useSyncExternalStore(
    subscribeToPendingToasts,
    getPendingToasts,
    getInitialToasts,
  );
  const [Toaster, setToaster] = useState<ComponentType | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (pending.length === 0 || Toaster) return;
    let active = true;
    void loadToaster().then(
      ({ Toaster }) => {
        if (active) setToaster(() => Toaster);
      },
      () => {
        if (active) setFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [pending, Toaster]);

  if (Toaster) return <Toaster />;
  if (!failed || pending.length === 0) return null;

  return (
    <div className="app-toast-viewport flex flex-col gap-3">
      {pending.map(({ id, message, description, type }) => (
        <Alert
          key={id}
          role={type === 'error' ? 'alert' : 'status'}
          variant={type === 'error' ? 'destructive' : 'default'}
          className="pointer-events-auto grid-cols-[1fr_auto] items-center bg-popover"
        >
          <AlertDescription className="col-start-1 wrap-anywhere">
            <p>{message}</p>
            {description && (
              <p
                tabIndex={0}
                className="control-focus control-focus-inset max-h-[min(35dvh,16rem)] overflow-y-auto whitespace-pre-line"
              >
                {description}
              </p>
            )}
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Meldung schließen"
            onClick={() => toast.dismiss(id)}
          >
            <X aria-hidden="true" />
          </Button>
        </Alert>
      ))}
    </div>
  );
}
