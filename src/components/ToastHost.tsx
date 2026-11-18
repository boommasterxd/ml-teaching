'use client';

import { useEffect, useState, useSyncExternalStore, type ComponentType } from 'react';
import {
  dismissPendingToast,
  getInitialToasts,
  getPendingToasts,
  subscribeToPendingToasts,
} from '@/lib/toast';
import { Alert, AlertDescription } from './ui/alert';
import Button from './Button';
import { X } from './icons/x';
import './ui/toast.css';

function importToaster() {
  return import('./ui/toast');
}

let prepared: ReturnType<typeof importToaster> | undefined;

function loadToaster() {
  return (prepared ??= importToaster().catch((error: unknown) => {
    prepared = undefined;
    throw error;
  }));
}

export function prepareToastViewport() {
  void loadToaster().catch(() => {});
}

/** Only load the viewport after an action produces a notification. */
export default function ToastHost() {
  const pending = useSyncExternalStore(
    subscribeToPendingToasts,
    getPendingToasts,
    getInitialToasts,
  );
  const [Toaster, setToaster] = useState<ComponentType | null>(null);
  const [failed, setFailed] = useState(false);
  const requested = pending.length > 0;

  useEffect(() => {
    if (!requested || Toaster) return;
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
  }, [requested, Toaster]);

  if (Toaster) return <Toaster />;
  if (!failed || !requested) return null;

  return (
    <div className="app-toast-viewport flex flex-col gap-3">
      {pending.map(({ id, message, type }) => (
        <Alert
          key={id}
          role={type === 'error' ? 'alert' : 'status'}
          variant={type === 'error' ? 'destructive' : 'default'}
          className="pointer-events-auto grid-cols-[1fr_auto] items-center bg-popover"
        >
          <AlertDescription className="col-start-1 [overflow-wrap:anywhere]">
            {message}
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Meldung schließen"
            onClick={() => dismissPendingToast(id)}
          >
            <X aria-hidden="true" />
          </Button>
        </Alert>
      ))}
    </div>
  );
}
