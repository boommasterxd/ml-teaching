import { describe, expect, it } from 'vitest';
import { assertImageDimensions, validateImageInput } from '@/lib/image-input-policy';

describe('original image resource contract', () => {
  it('allows a 48-megapixel mobile photo and the supported maximum while rejecting larger surfaces', () => {
    expect(() => assertImageDimensions(8064, 6048)).not.toThrow();
    expect(() => assertImageDimensions(8000, 8000)).not.toThrow();
    expect(() => assertImageDimensions(8001, 8000)).toThrow('64 Megapixel');
    expect(() => assertImageDimensions(16_385, 1)).toThrow('16.384 Pixel');
    expect(() => assertImageDimensions(0, 300)).toThrow('Bildabmessungen');
  });

  it('recognizes actual raster bytes independently of the filename and declared MIME type', async () => {
    const jpeg =
      '/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAADAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAABgj/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABykX//Z';
    const photo = new File(
      [Uint8Array.from(atob(jpeg), (value) => value.charCodeAt(0))],
      'camera.data',
      { type: 'application/octet-stream' },
    );
    await expect(validateImageInput(photo, new AbortController().signal)).resolves.toBeUndefined();
  });
});
