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
export function useDialogReturnFocus(open: boolean) {
  const candidates = useRef<(HTMLElement | null)[]>([]);
  const popup = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (open) {
      candidates.current = getReturnFocusCandidates(document.activeElement as HTMLElement);
    }
  }, [open]);

  useEffect(() => {
    if (open || candidates.current.length === 0) return;
    const closingPopup = popup.current;
    const targets = candidates.current;
    candidates.current = [];
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
        targets.find(canReturnFocus)?.focus({ preventScroll: true });
      }
    });
    return () => {
      pending = false;
    };
  }, [open]);

  return popup;
}
