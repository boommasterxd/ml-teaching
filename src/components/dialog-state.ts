import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

export function useDialogExitCallback(onExited?: () => void) {
  const callback = useRef(onExited);
  useLayoutEffect(() => {
    callback.current = onExited;
  }, [onExited]);
  return callback;
}

export function DialogExitObserver({
  callback,
}: {
  callback: RefObject<(() => void) | undefined>;
}) {
  useEffect(() => () => queueMicrotask(() => callback.current?.()), [callback]);
  return null;
}

function canReturnFocus(target: HTMLElement | null): target is HTMLElement {
  return Boolean(
    target?.isConnected &&
    target !== document.body &&
    !target.closest('[inert], [aria-hidden="true"], [data-state="closed"], [hidden]') &&
    !target.matches(':disabled'),
  );
}

function getReturnFocusCandidates(opener: HTMLElement | null) {
  const classInputs = [...document.querySelectorAll<HTMLElement>('input[id^="class-name-"]')];
  const following = classInputs.filter(
    (input) => opener && opener.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
  const preceding = classInputs.filter((input) => !following.includes(input)).reverse();
  return [
    opener,
    ...following,
    ...preceding,
    document.querySelector<HTMLElement>('#main-content h1[tabindex="-1"]'),
    document.getElementById('main-content'),
  ];
}
export function revealReturnedFocus(ref: RefObject<HTMLElement | null>) {
  const target = ref.current;
  ref.current = null;
  if (!target?.isConnected || document.activeElement !== target) return;
  const bounds = target.getBoundingClientRect();
  const headerBottom = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0;
  if (bounds.top < headerBottom || bounds.bottom > innerHeight) {
    target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
  }
}

export function useDialogReturnFocus(
  open: boolean,
  resolveReturnFocus?: () => HTMLElement | null,
  restoredFocus?: RefObject<HTMLElement | null>,
) {
  const returnFocus = useRef<{
    candidates: (HTMLElement | null)[];
    resolve?: () => HTMLElement | null;
  } | null>(null);
  const popup = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (open && !returnFocus.current) {
      returnFocus.current = {
        candidates: getReturnFocusCandidates(document.activeElement as HTMLElement),
        resolve: resolveReturnFocus,
      };
    }
  }, [open, resolveReturnFocus]);

  useEffect(() => {
    const target = returnFocus.current;
    if (open || !target) return;
    const closingPopup = popup.current;
    returnFocus.current = null;
    let pending = true;
    // Let Base UI release the surrounding accessibility tree before moving focus.
    queueMicrotask(() => {
      if (!pending) return;
      const active = document.activeElement;
      const nextDialog = document.querySelector(
        ':is([role="dialog"], [role="alertdialog"])[data-open]',
      );
      if (
        (!nextDialog || nextDialog === closingPopup) &&
        (active === document.body || closingPopup?.contains(active))
      ) {
        const preferred = target.resolve?.() ?? null;
        if (canReturnFocus(preferred)) {
          preferred.focus({ preventScroll: true });
          if (restoredFocus) restoredFocus.current = preferred;
        } else {
          target.candidates.find(canReturnFocus)?.focus({ preventScroll: true });
        }
      }
    });
    return () => {
      pending = false;
    };
  }, [open, restoredFocus]);

  return popup;
}
