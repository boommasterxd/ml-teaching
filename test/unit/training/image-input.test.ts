import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
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
  vi.unstubAllGlobals();
});

const files = () => ['first.png', 'second.png'].map((name) => file(name));

it('waits for feature extraction before decoding the next image and releases each URL', async () => {
  const extraction = Promise.withResolvers<void>();
  const onImage = vi.fn().mockReturnValueOnce(extraction.promise).mockResolvedValueOnce(undefined);
  const onError = vi.fn();
  const processing = processImageFiles(files(), onImage, onError, controller().signal);
  await loaded(0);
  await waitFor(() => expect(onImage).toHaveBeenCalledOnce());
  expect(images).toHaveLength(1);
  extraction.resolve();
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
