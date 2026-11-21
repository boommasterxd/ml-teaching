'use client';

import type { RefObject } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';

interface DeferredMenuLoadErrorProps {
  message: string;
  className: string;
  trigger: RefObject<HTMLButtonElement | null>;
  retry: () => void;
}

export function DeferredMenuLoadError({
  message,
  className,
  trigger,
  retry,
}: DeferredMenuLoadErrorProps) {
  return (
    <Alert className={className} role="alert">
      <AlertDescription>{message}</AlertDescription>
      <Button
        variant="secondary"
        onClick={() => {
          trigger.current?.focus({ preventScroll: true });
          retry();
        }}
      >
        Erneut versuchen
      </Button>
    </Alert>
  );
}
