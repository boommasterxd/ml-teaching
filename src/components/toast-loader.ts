function importToaster() {
  return import('./ui/toast');
}

let prepared: ReturnType<typeof importToaster> | undefined;

export function loadToaster() {
  return (prepared ??= importToaster().catch((error: unknown) => {
    prepared = undefined;
    throw error;
  }));
}

export function prepareToastViewport() {
  void loadToaster().catch(() => {});
}
