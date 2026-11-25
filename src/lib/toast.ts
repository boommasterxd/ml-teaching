import { ML } from '@/constants';

interface ToastOptions {
  id?: string;
  description?: string;
  timeout?: number;
}

type ToastType = 'error' | 'success' | 'info';

export interface Notification extends ToastOptions {
  id: string;
  message: string;
  type: ToastType;
}

export const TOAST_VISIBLE_LIMIT = 3;

const empty: readonly Notification[] = [];
let pending = empty;
let nextId = 0;
let viewport:
  { receive: (notification: Notification) => void; close: (id: string) => void } | undefined;
const listeners = new Set<() => void>();

function setPending(notifications: readonly Notification[]) {
  pending = notifications;
  for (const listener of listeners) listener();
}

function enqueuePending(notification: Notification) {
  const persistent = notification.timeout === 0;
  const limit = persistent ? ML.MAX_CLASSES : TOAST_VISIBLE_LIMIT;
  const queue = pending.filter(({ id }) => id !== notification.id);
  const sameLifetime = queue.filter(({ timeout }) => (timeout === 0) === persistent);
  const evicted = sameLifetime.length >= limit ? sameLifetime[0] : undefined;
  setPending([...queue.filter((item) => item !== evicted), notification]);
}

function publish(type: ToastType, message: string, options: ToastOptions = {}) {
  const id = options.id ?? `notice-${++nextId}`;
  const notification = { ...options, id, message, type };
  if (viewport) viewport.receive(notification);
  else enqueuePending(notification);
}

export const toast = {
  error: (message: string, options?: ToastOptions) => publish('error', message, options),
  success: (message: string, options?: ToastOptions) => publish('success', message, options),
  info: (message: string, options?: ToastOptions) => publish('info', message, options),
  dismiss: (id: string) => {
    if (viewport) viewport.close(id);
    else if (pending.some((item) => item.id === id)) {
      setPending(pending.filter((item) => item.id !== id));
    }
  },
};

export function connectToasts(connection: NonNullable<typeof viewport>) {
  viewport = connection;
  const queued = pending;
  setPending(empty);
  for (const notification of queued) connection.receive(notification);
  return () => {
    if (viewport === connection) viewport = undefined;
  };
}

export function subscribeToPendingToasts(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getPendingToasts = () => pending;
export const getInitialToasts = () => empty;
