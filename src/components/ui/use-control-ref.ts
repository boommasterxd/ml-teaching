import { useCallback, useImperativeHandle, useRef, type Ref } from 'react';
import { canReturnFocus } from '../dialog-state';

/** Preserve input focus across an SSR control's primitive upgrade without taking later focus. */
export function useControlRef<T extends HTMLElement>(
  forwardedRef: Ref<T> | undefined,
  enhanced: boolean,
) {
  const current = useRef<T | null>(null);
  const nodes = useRef<[T | null, T | null]>([null, null]);
  const restore = useRef(false);
  useImperativeHandle(forwardedRef, () => nodes.current[enhanced ? 1 : 0]!, [enhanced]);

  return useCallback(
    (node: T | null) => {
      nodes.current[enhanced ? 1 : 0] = node;
      if (current.current === node) return;
      if (current.current) {
        restore.current = document.activeElement === current.current;
      }
      current.current = node;
      if (!node) return;
      const shouldFocus = restore.current;
      restore.current = false;
      if (shouldFocus && document.activeElement === document.body && canReturnFocus(node))
        node.focus({ preventScroll: true });
    },
    [enhanced],
  );
}
