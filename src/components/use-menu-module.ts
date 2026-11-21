'use client';

import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';

/** Keep preparation independent of activation and reuse each in-flight import. */
export function useMenuModule<T>(load: () => Promise<T>, initialModule?: T) {
  const [module, setModule] = useState(() => initialModule);
  const [failed, setFailed] = useState(false);
  const requested = useRef(initialModule !== undefined);

  const prepare = useCallback(() => {
    if (requested.current) return;
    requested.current = true;
    setFailed(false);
    void load().then(
      (result) => setModule(() => result),
      () => {
        requested.current = false;
        setFailed(true);
      },
    );
  }, [load]);

  return { module, failed, prepare };
}

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
