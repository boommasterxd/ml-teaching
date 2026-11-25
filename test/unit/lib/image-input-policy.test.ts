import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertImageDimensions, validateImageInput } from '@/lib/image-input-policy';

const pngSignature = '89504e470d0a1a0a';
const pngDimensions = '0000000d 49484452 00000002 00000003';
const cgbiHeader = `${pngSignature} 00000004 43674249 40000000 00000000 ${pngDimensions}`;

function headerBytes(hex: string) {
  return Uint8Array.fromHex(hex.replaceAll(' ', ''));
}

function jpegPhoto() {
  const jpeg =
    '/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAADAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAABgj/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABykX//Z';
  return new File([Uint8Array.from(atob(jpeg), (value) => value.charCodeAt(0))], 'camera.data', {
    type: 'application/octet-stream',
  });
}

function containerMetadata(brand: string) {
  const fileType = `00000010 66747970 ${brand} 00000000`;
  const metaBox = '00000052 6d657461 00000000';
  const primaryItem = '0000000e 7069746d 00000000 0001';
  const properties = '00000038 69707270';
  const dimensions = '0000001c 6970636f 00000014 69737065 00000000 00000002 00000003';
  const association = '00000014 69706d61 00000000 00000001 0001 01 01';
  return headerBytes(
    `${fileType} ${metaBox} ${primaryItem} ${properties} ${dimensions} ${association}`,
  );
}

describe('original image resource contract', () => {
  afterEach(() => vi.restoreAllMocks());

  it('allows a 48-megapixel mobile photo and the supported maximum while rejecting larger surfaces', () => {
    expect(() => assertImageDimensions(8064, 6048)).not.toThrow();
    expect(() => assertImageDimensions(8000, 8000)).not.toThrow();
    expect(() => assertImageDimensions(8001, 8000)).toThrow('64 Megapixel');
    expect(() => assertImageDimensions(16_385, 1)).toThrow('16.384 Pixel');
    expect(() => assertImageDimensions(0, 300)).toThrow('Bildabmessungen');
  });

  it.each([
    ['PNG', `${pngSignature} ${pngDimensions}`],
    ['CgBI PNG', cgbiHeader],
    ['GIF87a', '474946383761 0200 0300'],
    ['GIF89a', '474946383961 0200 0300'],
    ['VP8 WebP', '52494646 56000000 57454250 56503820 0a000000 000000000000 0200 0300'],
    ['VP8L WebP', '52494646 56000000 57454250 5650384c 05000000 2f01800000'],
    ['VP8X WebP', '52494646 56000000 57454250 56503858 0a000000 00000000 010000 020000'],
  ])('checks %s dimensions without reading the rest of the file', async (format, hex) => {
    const read = vi.spyOn(FileReader.prototype, 'readAsArrayBuffer');
    const photo = new File([headerBytes(hex), new Uint8Array(64)], `${format}.data`);

    await expect(validateImageInput(photo, new AbortController().signal)).resolves.toBeUndefined();
    expect(read.mock.calls.map(([blob]) => blob.size)).toEqual([40]);
  });

  it('recognizes JPEG dimensions beyond the prefix independently of filename and MIME type', async () => {
    const read = vi.spyOn(FileReader.prototype, 'readAsArrayBuffer');
    const photo = jpegPhoto();

    await expect(validateImageInput(photo, new AbortController().signal)).resolves.toBeUndefined();
    expect(read.mock.calls.map(([blob]) => blob.size)).toEqual([40, photo.size]);
  });

  it.each([
    ['AVIF', '61766966'],
    ['HEIC', '68656963'],
  ])('finds the primary image dimensions beyond the %s file-type box', async (format, brand) => {
    const read = vi.spyOn(FileReader.prototype, 'readAsArrayBuffer');
    const photo = new File([containerMetadata(brand)], `${format}.data`);

    await expect(validateImageInput(photo, new AbortController().signal)).resolves.toBeUndefined();
    expect(read.mock.calls.map(([blob]) => blob.size)).toEqual([40, photo.size]);
  });

  it('rejects an unsupported signature without reading the rest of the file', async () => {
    const read = vi.spyOn(FileReader.prototype, 'readAsArrayBuffer');
    const file = new File(['<svg>', new Uint8Array(64)], 'disguised.png', { type: 'image/png' });

    await expect(validateImageInput(file, new AbortController().signal)).rejects.toThrow(
      'Bitte nutze eine gültige',
    );
    expect(read.mock.calls.map(([blob]) => blob.size)).toEqual([40]);
  });

  it('propagates cancellation while reading past the prefix', async () => {
    const controller = new AbortController();
    const reason = new DOMException('Cancelled during the full read', 'AbortError');
    const photo = jpegPhoto();
    const readAsArrayBuffer = FileReader.prototype.readAsArrayBuffer;
    const read = vi.spyOn(FileReader.prototype, 'readAsArrayBuffer').mockImplementation(function (
      this: FileReader,
      blob,
    ) {
      readAsArrayBuffer.call(this, blob);
      if (blob === photo) controller.abort(reason);
    });

    await expect(validateImageInput(photo, controller.signal)).rejects.toBe(reason);
    expect(read.mock.calls.map(([blob]) => blob.size)).toEqual([40, photo.size]);
  });
});
