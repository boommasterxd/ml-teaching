let pending: Promise<typeof import('./ThemeMenu')> | undefined;

/** Intent and activation share one chunk request; a rejected load remains retryable. */
export function loadThemeMenu() {
  pending ??= import('./ThemeMenu').catch((error: unknown) => {
    pending = undefined;
    throw error;
  });
  return pending;
}
