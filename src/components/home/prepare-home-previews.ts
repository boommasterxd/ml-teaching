export type HomePreviewRuntime = typeof import('./preview-runtime');

let pending: Promise<HomePreviewRuntime> | undefined;
export function prepareHomePreviews() {
  pending ??= import('./preview-runtime').catch((error: unknown) => {
    pending = undefined;
    throw error;
  });
  return pending;
}
