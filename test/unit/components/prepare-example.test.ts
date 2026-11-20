import { afterEach, describe, expect, it, vi } from 'vitest';
import { exampleImageProps } from '@/components/network/examples';

class TestImage {
  static instances: TestImage[] = [];
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  sizes = '';
  srcset = '';
  src = '';
  decode = vi.fn(() => Promise.resolve());
  removeAttribute = vi.fn();
  constructor() {
    TestImage.instances.push(this);
  }
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
  TestImage.instances = [];
});

describe('example image preparation', () => {
  it('shares the in-flight load and decodes the native optimized image', async () => {
    vi.stubGlobal('Image', TestImage);
    const { prepareExample } = await import('@/components/network/prepare-example');
    const first = prepareExample('dog');
    expect(prepareExample('dog')).toBe(first);
    expect(TestImage.instances).toHaveLength(1);
    const image = TestImage.instances[0];
    const props = exampleImageProps('dog');
    expect(image.src).toBe(props.src);
    expect(image.srcset).toBe(props.srcSet);
    expect(image.src).toContain('/_next/image');
    image.onload?.();
    await expect(first).resolves.toBeUndefined();
    expect(image.decode).toHaveBeenCalledOnce();
  });

  it('allows another load after a failed image', async () => {
    vi.stubGlobal('Image', TestImage);
    const { prepareExample } = await import('@/components/network/prepare-example');
    const first = prepareExample('cat');
    TestImage.instances[0].onerror?.();
    await expect(first).rejects.toThrow('Example image unavailable');
    const retry = prepareExample('cat');
    expect(TestImage.instances).toHaveLength(2);
    TestImage.instances[1].onload?.();
    await expect(retry).resolves.toBeUndefined();
  });
  it('times out an unfinished decode and permits a successful retry', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('Image', TestImage);
    const { prepareExample } = await import('@/components/network/prepare-example');
    const first = prepareExample('dog');
    TestImage.instances[0].decode.mockReturnValue(new Promise(() => {}));
    TestImage.instances[0].onload?.();
    const rejection = expect(first).rejects.toThrow('Example image timed out');
    await vi.advanceTimersByTimeAsync(8_000);
    await rejection;
    const retry = prepareExample('dog');
    expect(TestImage.instances).toHaveLength(2);
    TestImage.instances[1].onload?.();
    await expect(retry).resolves.toBeUndefined();
  });
});
