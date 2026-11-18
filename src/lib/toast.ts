interface ToastOptions {
  id?: string;
}

type ToastType = 'error' | 'success' | 'info';

export interface Notification extends ToastOptions {
  id: string;
  message: string;
  type: ToastType;
}

const empty: readonly Notification[] = [];
let pending = empty;
let nextId = 0;
let receive: ((notification: Notification) => void) | undefined;
const listeners = new Set<() => void>();

function setPending(notifications: readonly Notification[]) {
  pending = notifications;
  for (const listener of listeners) listener();
}

function publish(type: ToastType, message: string, options: ToastOptions = {}) {
  const id = options.id ?? `notice-${++nextId}`;
  const notification = { ...options, id, message, type };
  if (receive) receive(notification);
  else setPending([...pending.filter((item) => item.id !== id), notification].slice(-3));
}

export const toast = {
  error: (message: string, options?: ToastOptions) => publish('error', message, options),
  success: (message: string, options?: ToastOptions) => publish('success', message, options),
  info: (message: string, options?: ToastOptions) => publish('info', message, options),
};

export function connectToasts(receiver: (notification: Notification) => void) {
  receive = receiver;
  const queued = pending;
  setPending(empty);
  for (const notification of queued) receiver(notification);
  return () => {
    if (receive === receiver) receive = undefined;
  };
}

export function dismissPendingToast(id: string) {
  setPending(pending.filter((item) => item.id !== id));
}

export function subscribeToPendingToasts(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getPendingToasts = () => pending;
export const getInitialToasts = () => empty;
