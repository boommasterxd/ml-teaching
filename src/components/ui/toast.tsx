'use client';

import { useCallback, useEffect, useState } from 'react';
import { Toast as Primitive } from '@animate-ui/react/primitives/base-ui/toast';
import { connectToasts } from '@/lib/toast';
import { cn } from '@/lib/utils';
import Button from '../Button';
import { AlertCircle } from '../icons/alert-circle';
import { CheckCircle2 } from '../icons/check-circle2';
import { X } from '../icons/x';

// shadcn's Base UI Toast composition with Animate UI owning entry, exit and swipe.
function ToastList() {
  const { toasts, add } = Primitive.useToastManager();
  const [top, setTop] = useState<boolean | null>(null);
  const attachViewport = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const update = () => {
      setTop(getComputedStyle(element).getPropertyValue('--toast-side').trim() === 'top');
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(
    () =>
      connectToasts(({ id, message, type }) => {
        add({ id, title: message, type });
      }),
    [add],
  );

  return (
    <Primitive.Portal>
      <Primitive.Viewport
        ref={attachViewport}
        className="app-toast-viewport"
        data-slot="toast-viewport"
        aria-label="Mitteilungen"
        aria-keyshortcuts="F6"
      >
        {top !== null &&
          toasts.map((item) => (
            <Primitive.Root
              data-slot="toast"
              key={item.id}
              toast={item}
              swipeDirection={top ? 'up' : ['down', 'right']}
              className="app-toast rounded-xl border bg-popover text-popover-foreground shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Primitive.Content
                data-slot="toast-content"
                className="flex h-full items-center gap-3 p-4 data-behind:opacity-0 data-expanded:opacity-100"
              >
                <ToastIcon type={item.type} />
                <Primitive.Title
                  data-slot="toast-title"
                  className="min-w-0 flex-1 text-sm font-medium [overflow-wrap:anywhere]"
                />
                <Primitive.Close
                  aria-label="Meldung schließen"
                  render={<Button variant="ghost" size="icon-sm" />}
                >
                  <X aria-hidden="true" />
                </Primitive.Close>
              </Primitive.Content>
            </Primitive.Root>
          ))}
      </Primitive.Viewport>
    </Primitive.Portal>
  );
}

function ToastIcon({ type }: { type: string | undefined }) {
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <span
      data-slot="toast-icon"
      className={cn(
        'shrink-0 text-muted-foreground',
        type === 'success' && 'text-success',
        type === 'error' && 'text-destructive',
      )}
    >
      <Icon aria-hidden="true" />
    </span>
  );
}

export function Toaster() {
  return (
    <Primitive.Provider progressBar={false} limit={3} timeout={6000}>
      <ToastList />
    </Primitive.Provider>
  );
}
