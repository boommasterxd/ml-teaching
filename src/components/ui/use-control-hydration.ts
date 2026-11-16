import { useImperativeHandle, useRef, useSyncExternalStore, type Ref } from 'react';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/** Client-only indicator and form bridges never replace their interactive trigger. */
export function useControlHydrated() {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}

/** Preserve React ref cleanup across primitive Slots without changing focus. */
export function useControlRef<T extends HTMLElement>(forwardedRef: Ref<T> | undefined) {
  const control = useRef<T | null>(null);
  useImperativeHandle(forwardedRef, () => control.current!, []);
  return control;
}
