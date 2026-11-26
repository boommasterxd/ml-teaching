import { renderHook, waitFor } from '@testing-library/react';
import { browser } from '@tensorflow/tfjs-core';
import { afterEach, expect, it, vi } from 'vitest';
import { useImageFeatureExtraction } from '@/hooks/useImageFeatureExtraction';
import { retireModel } from '@/lib/ml-runtime';
import type { FeatureExtractor } from '@/types/ml-models';

vi.mock('@tensorflow/tfjs-core', () => ({ browser: { fromPixels: vi.fn() } }));

afterEach(() => vi.restoreAllMocks());

it('discards queued and in-flight uploads when training closes and releases GPU resources in order', async () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    setTransform: vi.fn(),
    drawImage: vi.fn(),
  } as never);
  const pixels = { dispose: vi.fn() };
  vi.mocked(browser.fromPixels).mockReturnValue(pixels as never);
  const readback = Promise.withResolvers<Float32Array>();
  const features = { data: () => readback.promise, dispose: vi.fn() };
  const model: FeatureExtractor = {
    infer: vi.fn(() => features as never),
    dispose: vi.fn(),
  };
  const { result, unmount } = renderHook(() => useImageFeatureExtraction(model));
  const image = document.createElement('img');
  image.width = 224;
  image.height = 224;

  const active = result.current.extractFeatures(image, false, true);
  await waitFor(() => expect(model.infer).toHaveBeenCalledOnce());
  const queued = result.current.extractFeatures(image, false, true);
  unmount();
  retireModel(model);
  expect(await queued).toBeNull();
  expect(model.dispose).not.toHaveBeenCalled();

  readback.resolve(new Float32Array([1, 0]));
  expect(await active).toBeNull();
  expect(model.infer).toHaveBeenCalledOnce();
  expect(pixels.dispose).toHaveBeenCalledOnce();
  expect(features.dispose).toHaveBeenCalledOnce();
  expect(model.dispose).toHaveBeenCalledOnce();
});
