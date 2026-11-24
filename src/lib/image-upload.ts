import {
  assertImageDimensions,
  IMAGE_INPUT_LIMITS,
  validateImageInput,
} from './image-input-policy';
import { acquireImageUpload } from './image-upload-queue';

function decodeImage(image: HTMLImageElement, url: string, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      signal.removeEventListener('abort', abort);
      image.onload = null;
      image.onerror = null;
    };
    const abort = () => {
      cleanup();
      image.src = '';
      reject(signal.reason);
    };
    image.onload = () => {
      cleanup();
      resolve();
    };
    image.onerror = () => {
      cleanup();
      reject(new Error('Das Bild konnte nicht geladen werden.'));
    };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    else image.src = url;
  });
}

async function prepareImage(file: File, signal: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  const timer = setTimeout(
    () =>
      controller.abort(
        new Error(
          'Das Bild konnte nicht innerhalb von 15 Sekunden geladen werden. Bitte verkleinere es oder versuche es erneut.',
        ),
      ),
    IMAGE_INPUT_LIMITS.PREPARATION_TIMEOUT_MS,
  );
  let image: HTMLImageElement | null = null;
  let url: string | null = null;
  const dispose = () => {
    if (image) image.src = '';
    if (url) URL.revokeObjectURL(url);
  };
  try {
    await validateImageInput(file, controller.signal);
    controller.signal.throwIfAborted();
    url = URL.createObjectURL(file);
    image = new Image();
    await decodeImage(image, url, controller.signal);
    controller.signal.throwIfAborted();
    assertImageDimensions(image.naturalWidth, image.naturalHeight);
    return { image, dispose };
  } catch (error) {
    dispose();
    throw error;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}

/** Serialize originals globally; release the source only after feature extraction settles. */
export async function processImageFiles(
  files: File[],
  onImage: (image: HTMLImageElement) => void | Promise<void>,
  onError: (message: string) => void,
  signal: AbortSignal,
  hasCapacity: () => boolean = () => true,
): Promise<void> {
  for (const file of files) {
    if (signal.aborted) return;
    let release: (() => void) | undefined;
    try {
      release = await acquireImageUpload(signal);
      if (signal.aborted || !hasCapacity()) return;
      const prepared = await prepareImage(file, signal);
      try {
        if (!signal.aborted) await onImage(prepared.image);
      } finally {
        prepared.dispose();
      }
    } catch (error) {
      if (!signal.aborted)
        onError(
          `"${file.name}": ${error instanceof Error ? error.message : 'Das Bild konnte nicht verarbeitet werden.'}`,
        );
    } finally {
      release?.();
    }
  }
}
