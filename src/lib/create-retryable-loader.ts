export function createRetryableLoader<T>(load: () => Promise<T>) {
  let pending: Promise<T> | undefined;
  let loaded: T | undefined;

  function request() {
    pending ??= load().then(
      (result) => {
        loaded = result;
        return result;
      },
      (error: unknown) => {
        pending = undefined;
        throw error;
      },
    );
    return pending;
  }

  return Object.assign(request, { getLoaded: () => loaded });
}
