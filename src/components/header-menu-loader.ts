let pending: Promise<typeof import('./HeaderMenuPanel')> | undefined;

export function loadHeaderMenu() {
  pending ??= import('./HeaderMenuPanel').catch((error: unknown) => {
    pending = undefined;
    throw error;
  });
  return pending;
}
