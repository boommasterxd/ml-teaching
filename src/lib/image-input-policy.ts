import { imageDimensionsFromData } from 'image-dimensions';

/** Bounds one original photo before the browser allocates its decoded surface. */
export const IMAGE_INPUT_LIMITS = {
  MAX_BYTES: 32 * 1024 * 1024,
  MAX_PIXELS: 64_000_000,
  MAX_AXIS: 16_384,
  PREPARATION_TIMEOUT_MS: 15_000,
  MAX_WAITING_JOBS: 15,
} as const;

export const IMAGE_INPUT_ACCEPT =
  'image/jpeg,image/png,image/gif,image/webp,image/avif,image/heic,image/heif';

// image-dimensions reads at most 40 bytes for PNG (including CgBI), GIF, and WebP.
const rasterHeaderLength = 40;

function rasterHeaderKind(bytes: Uint8Array): 'fixed' | 'variable' | undefined {
  const ascii = (offset: number, length: number) =>
    String.fromCharCode(...bytes.subarray(offset, offset + length));
  if ((bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) || ascii(4, 4) === 'ftyp')
    return 'variable';
  if (
    [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value) ||
    ['GIF87a', 'GIF89a'].includes(ascii(0, 6)) ||
    (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP')
  )
    return 'fixed';
}

export function assertImageDimensions(width: number, height: number): void {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0)
    throw new Error('Die Bildabmessungen konnten nicht sicher gelesen werden.');
  if (
    width > IMAGE_INPUT_LIMITS.MAX_AXIS ||
    height > IMAGE_INPUT_LIMITS.MAX_AXIS ||
    width * height > IMAGE_INPUT_LIMITS.MAX_PIXELS
  )
    throw new Error(
      'Das Bild ist zu groß. Erlaubt sind höchstens 64 Megapixel und 16.384 Pixel je Kante. Bitte verkleinere es.',
    );
}

function readFile(file: Blob, signal: AbortSignal): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const cleanup = () => {
      signal.removeEventListener('abort', abort);
      reader.onload = null;
      reader.onerror = null;
      reader.onabort = null;
    };
    const abort = () => {
      cleanup();
      reader.abort();
      reject(signal.reason);
    };
    reader.onload = () => {
      cleanup();
      if (reader.result && typeof reader.result !== 'string') resolve(reader.result);
      else reject(new Error('Die Bilddatei konnte nicht gelesen werden.'));
    };
    reader.onerror = () => {
      cleanup();
      reject(new Error('Die Bilddatei konnte nicht gelesen werden.'));
    };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    else reader.readAsArrayBuffer(file);
  });
}

/** Inspect bounded file bytes, never a filename/MIME claim or a decoded bitmap. */
export async function validateImageInput(file: File, signal: AbortSignal): Promise<void> {
  if (file.size > IMAGE_INPUT_LIMITS.MAX_BYTES)
    throw new Error('Die Bilddatei ist größer als 32 MiB. Bitte verkleinere sie.');
  const prefix = new Uint8Array(await readFile(file.slice(0, rasterHeaderLength), signal));
  const headerKind = rasterHeaderKind(prefix);
  const bytes =
    headerKind === 'variable' && prefix.byteLength < file.size
      ? new Uint8Array(await readFile(file, signal))
      : prefix;
  signal.throwIfAborted();
  let dimensions;
  try {
    dimensions = headerKind ? imageDimensionsFromData(bytes) : undefined;
  } catch {
    // Malformed headers receive the same public recovery message as unknown formats.
  }
  if (!dimensions)
    throw new Error('Bitte nutze eine gültige JPG-, PNG-, GIF-, WebP-, AVIF- oder HEIC-Bilddatei.');
  assertImageDimensions(dimensions.width, dimensions.height);
}
