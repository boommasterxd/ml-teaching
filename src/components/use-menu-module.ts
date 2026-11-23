'use client';

import { useEffect, useEffectEvent, useRef } from 'react';

export { useDeferredModule as useMenuModule } from '@/hooks/use-deferred-module';

interface PendingMenuDismissal {
  active: boolean;
  popupSelector: string;
  onDismiss: () => void;
}

export function usePendingMenuDismissal({
  active,
  popupSelector,
  onDismiss,
}: PendingMenuDismissal) {
  const area = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dismiss = useEffectEvent(onDismiss);

  useEffect(() => {
    if (!active) return;

    function escape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      dismiss();
      trigger.current?.focus({ preventScroll: true });
    }

    function outside(event: Event) {
      const target = event.target;
      if (!(target instanceof Element) || area.current?.contains(target)) return;
      // Base UI may focus the portal before the pending listeners are removed.
      if (!target.closest(popupSelector)) dismiss();
    }

    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
    };
  }, [active, popupSelector]);

  return { area, trigger };
}
