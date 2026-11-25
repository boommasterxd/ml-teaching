import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/dom';
import { processImageFiles } from '@/lib/image-upload';
import { IMAGE_INPUT_LIMITS } from '@/lib/image-input-policy';

const images: Array<{
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  onload: null | (() => void);
  onerror: null | (() => void);
}> = [];
const controllers: AbortController[] = [];
const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWP4z8DwnwGMERQARNAF+661WskAAAAASUVORK5CYII=';

function file(name = 'photo.png') {
  return new File([Uint8Array.from(atob(png), (character) => character.charCodeAt(0))], name, {
    type: 'image/png',
  });
}

function controller() {
  const instance = new AbortController();
  controllers.push(instance);
  return instance;
}

async function loaded(index: number) {
  await waitFor(() => expect(images).toHaveLength(index + 1));
  images[index].onload?.();
}

beforeEach(() => {
  images.length = 0;
  controllers.length = 0;
  vi.stubGlobal(
    'Image',
    class {
      src = '';
      naturalWidth = 2;
      naturalHeight = 3;
      onload = null;
      onerror = null;
      constructor() {
        images.push(this);
      }
    },
  );
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn((file: File) => `blob:${file.name}`),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  controllers.forEach((instance) => instance.abort());
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const files = () => ['first.png', 'second.png'].map((name) => file(name));

describe('local image upload', () => {
  it('waits for feature extraction before decoding the next image and releases each URL', async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const onImage = vi.fn().mockReturnValueOnce(pending).mockResolvedValueOnce(undefined);
    const onError = vi.fn();
    const processing = processImageFiles(files(), onImage, onError, controller().signal);
    await loaded(0);
    await waitFor(() => expect(onImage).toHaveBeenCalledOnce());
    expect(images).toHaveLength(1);
    finish();
    await loaded(1);
    await processing;
    expect(onImage).toHaveBeenCalledTimes(2);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:first.png');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:second.png');
    expect(onError).not.toHaveBeenCalled();
  });

  it('cancels pending decoding on navigation and does not process remaining files', async () => {
    const active = controller();
    const onImage = vi.fn();
    const onError = vi.fn();
    const processing = processImageFiles(files(), onImage, onError, active.signal);
    await waitFor(() => expect(images).toHaveLength(1));
    active.abort();
    await processing;
    expect(images).toHaveLength(1);
    expect(images[0].src).toBe('');
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
    expect(onImage).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('skips a queued file when its class fills and lets the following class proceed', async () => {
    const held = Promise.withResolvers<void>();
    const onError = vi.fn();
    const active = processImageFiles(
      [file('active.png')],
      () => held.promise,
      onError,
      controller().signal,
    );
    await loaded(0);

    const blocked = file('class-full.png');
    const read = vi.spyOn(FileReader.prototype, 'readAsArrayBuffer');
    const hasCapacity = vi.fn(() => true);
    const discarded = vi.fn();
    const pending = processImageFiles(
      [blocked],
      discarded,
      onError,
      controller().signal,
      hasCapacity,
    );
    const onNext = vi.fn();
    const nextFile = file('next.png');
    const sliceNext = vi.spyOn(nextFile, 'slice');
    const next = processImageFiles([nextFile], onNext, onError, controller().signal);
    hasCapacity.mockReturnValue(false);
    held.resolve();

    await expect(pending).resolves.toBe(1);
    await loaded(1);
    await Promise.all([active, next]);
    expect(sliceNext).toHaveBeenCalledExactlyOnceWith(0, 40);
    expect(read).toHaveBeenCalledOnce();
    expect(read.mock.calls[0]?.[0]).toBe(sliceNext.mock.results[0]?.value);
    expect(discarded).not.toHaveBeenCalled();
    expect(onNext).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
  });

  it('counts remaining files when the class becomes full during feature extraction', async () => {
    const extraction = Promise.withResolvers<'capacity'>();
    const onImage = vi.fn(() => extraction.promise);
    const onError = vi.fn();
    const processing = processImageFiles(files(), onImage, onError, controller().signal);
    await loaded(0);
    await waitFor(() => expect(onImage).toHaveBeenCalledOnce());
    extraction.resolve('capacity');

    await expect(processing).resolves.toBe(2);
    expect(images).toHaveLength(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:first.png');
    expect(onError).not.toHaveBeenCalled();
  });

  it('reports a broken image, frees it, and continues with the next file', async () => {
    const onImage = vi.fn();
    const onError = vi.fn();
    const processing = processImageFiles(files(), onImage, onError, controller().signal);
    await waitFor(() => expect(images).toHaveLength(1));
    images[0].onerror?.();
    await loaded(1);
    await processing;
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('first.png'));
    expect(onImage).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('serializes originals across classes fairly and retains every selected image', async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const received: string[] = [];
    const onImage = vi.fn((image: HTMLImageElement) => {
      received.push(image.src);
      return received.length === 1 ? pending : Promise.resolve();
    });
    const onError = vi.fn();
    const first = processImageFiles(files(), onImage, onError, controller().signal);
    const second = processImageFiles(
      [file('other-class.png')],
      onImage,
      onError,
      controller().signal,
    );
    await loaded(0);
    await waitFor(() => expect(onImage).toHaveBeenCalledOnce());
    expect(images).toHaveLength(1);
    expect(images[0].src).toBe('blob:first.png');
    finish();
    await loaded(1);
    expect(images[0].src).toBe('');
    expect(images[1].src).toBe('blob:other-class.png');
    await loaded(2);
    await Promise.all([first, second]);
    expect(received).toEqual(['blob:first.png', 'blob:other-class.png', 'blob:second.png']);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3);
    expect(onError).not.toHaveBeenCalled();
  });

  it('cancels a queued class without decoding it and frees the slot after extraction fails', async () => {
    const onError = vi.fn();
    const first = processImageFiles(
      [file()],
      async () => {
        throw new Error('Extraction failed');
      },
      onError,
      controller().signal,
    );
    const cancelled = controller();
    const onCancelledImage = vi.fn();
    const second = processImageFiles(
      [file('cancelled.png')],
      onCancelledImage,
      onError,
      cancelled.signal,
    );
    cancelled.abort();
    await second;
    await loaded(0);
    await first;
    expect(onCancelledImage).not.toHaveBeenCalled();
    expect(images).toHaveLength(1);
    const recovered = processImageFiles(
      [file('recovered.png')],
      vi.fn(),
      onError,
      controller().signal,
    );
    await loaded(1);
    await recovered;
    expect(onError).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('rejects oversized headers, oversized files and disguised SVG before browser decoding', async () => {
    const oversized = file('oversized.png');
    Object.defineProperty(oversized, 'size', { value: IMAGE_INPUT_LIMITS.MAX_BYTES + 1 });
    const bytes = Uint8Array.from(atob(png), (character) => character.charCodeAt(0));
    new DataView(bytes.buffer).setUint32(16, 100_000);
    const huge = new File([bytes], 'huge.png', { type: 'image/png' });
    const svg = new File(['<svg width="1" height="1"></svg>'], 'fake.png', { type: 'image/png' });
    const onImage = vi.fn();
    const onError = vi.fn();
    await processImageFiles([oversized, huge, svg], onImage, onError, controller().signal);
    expect(images).toHaveLength(0);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(onImage).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(3);
    const recovered = processImageFiles([file()], onImage, onError, controller().signal);
    await loaded(0);
    await recovered;
    expect(onImage).toHaveBeenCalledOnce();
  });

  it('times out stalled decoding, clears its source and continues with the next image', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const onImage = vi.fn();
    const onError = vi.fn();
    const processing = processImageFiles(files(), onImage, onError, controller().signal);
    await vi.waitFor(() => expect(images).toHaveLength(1));
    await vi.advanceTimersByTimeAsync(IMAGE_INPUT_LIMITS.PREPARATION_TIMEOUT_MS);
    expect(images[0].src).toBe('');
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('15 Sekunden'));
    await vi.waitFor(() => expect(images).toHaveLength(2));
    images[1].onload?.();
    await processing;
    expect(onImage).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('validates decoded dimensions again before extracting features', async () => {
    const onImage = vi.fn();
    const onError = vi.fn();
    const processing = processImageFiles([file()], onImage, onError, controller().signal);
    await waitFor(() => expect(images).toHaveLength(1));
    images[0].naturalWidth = IMAGE_INPUT_LIMITS.MAX_AXIS + 1;
    images[0].onload?.();
    await processing;
    expect(onImage).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('16.384 Pixel'));
    expect(images[0].src).toBe('');
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
  });

  it('bounds queued originals and removes cancelled batches before they allocate browser resources', async () => {
    const onImage = vi.fn();
    const onError = vi.fn();
    const active = processImageFiles([file()], onImage, onError, controller().signal);
    const queued = Array.from({ length: IMAGE_INPUT_LIMITS.MAX_WAITING_JOBS }, (_, index) =>
      processImageFiles([file(`queued-${index}.png`)], onImage, onError, controller().signal),
    );
    await processImageFiles([file('overflow.png')], onImage, onError, controller().signal);
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('Zu viele Bilder'));
    controllers.slice(1).forEach((instance) => instance.abort());
    await Promise.all(queued);
    await loaded(0);
    await active;
    expect(images).toHaveLength(1);
    expect(onImage).toHaveBeenCalledOnce();
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
  });

  it('aborts stalled file reading on deadline without creating an image or URL', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const abort = vi.fn();
    vi.stubGlobal(
      'FileReader',
      class {
        abort = abort;
        readAsArrayBuffer = vi.fn();
      },
    );
    const onImage = vi.fn();
    const onError = vi.fn();
    const processing = processImageFiles([file()], onImage, onError, controller().signal);
    await vi.advanceTimersByTimeAsync(IMAGE_INPUT_LIMITS.PREPARATION_TIMEOUT_MS);
    await processing;
    expect(abort).toHaveBeenCalledOnce();
    expect(onImage).not.toHaveBeenCalled();
    expect(images).toHaveLength(0);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('15 Sekunden'));
    expect(vi.getTimerCount()).toBe(0);
  });
});
