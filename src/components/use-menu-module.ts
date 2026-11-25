'use client';

import { useEffect, useEffectEvent, useRef, type RefObject } from 'react';

export { useDeferredModule as useMenuModule } from '@/hooks/use-deferred-module';

export function useMenuActivationFocus(trigger: RefObject<HTMLButtonElement | null>) {
  const focusOnOpen = useRef(false);

  function trackMenuActivation(open: boolean, event: Event) {
    focusOnOpen.current =
      open &&
      (event instanceof KeyboardEvent ||
        (event instanceof MouseEvent && event.type === 'click' && event.detail === 0));
  }

  function focusFirstHighlightedItem(item: HTMLElement | undefined) {
    if (!focusOnOpen.current || !item) return;
    focusOnOpen.current = false;
    // Focus the first native highlight once the deferred menu items exist.
    if (item.ownerDocument.activeElement === trigger.current) {
      item.focus({ preventScroll: true });
    }
  }

  return { trackMenuActivation, focusFirstHighlightedItem };
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
