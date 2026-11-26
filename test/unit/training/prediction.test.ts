import { act, renderHook } from '@testing-library/react';
import { browser } from '@tensorflow/tfjs-core';
import { afterEach, expect, it, vi } from 'vitest';
import { PREDICTION } from '@/constants';
import { usePredictionLoop } from '@/hooks/usePredictionLoop';
import { retireModel } from '@/lib/ml-runtime';
import type { Classifier, FeatureExtractor } from '@/types/ml-models';

vi.mock('@tensorflow/tfjs-core', () => ({ browser: { fromPixels: vi.fn() } }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function predictionModels(classify: Classifier['predictClass']) {
  const features = { dispose: vi.fn() };
  const model = {
    infer: vi.fn(() => features as never),
    dispose: vi.fn(),
  } satisfies FeatureExtractor;
  const classifier = {
    addExample: vi.fn(),
    setClassifierDataset: vi.fn(),
    getNumClasses: () => 2,
    predictClass: vi.fn(classify),
    dispose: vi.fn(),
  } satisfies Classifier;

  return { classifier, model, features };
}

it('discards an in-flight prediction after model replacement and releases the retired resources on settlement', async () => {
  const requestFrame = vi.fn<(callback: FrameRequestCallback) => number>().mockReturnValue(1);
  vi.stubGlobal('requestAnimationFrame', requestFrame);
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    setTransform: vi.fn(),
    drawImage: vi.fn(),
  } as never);

  const oldPixels = { dispose: vi.fn() };
  const newPixels = { dispose: vi.fn() };
  vi.mocked(browser.fromPixels)
    .mockReturnValueOnce(oldPixels as never)
    .mockReturnValueOnce(newPixels as never);
  const pending = Promise.withResolvers<Awaited<ReturnType<Classifier['predictClass']>>>();
  const old = predictionModels(() => pending.promise);
  const nextPrediction = { label: 'current', confidences: { current: 1 } };
  const next = predictionModels(async () => nextPrediction);
  const video = document.createElement('video');
  Object.defineProperties(video, {
    readyState: { value: HTMLMediaElement.HAVE_CURRENT_DATA },
    videoWidth: { value: 224 },
    videoHeight: { value: 224 },
  });
  const videoRef = { current: video };
  const onError = vi.fn();
  const { result, rerender } = renderHook(
    ({ classifier, model }) => usePredictionLoop(classifier, model, videoRef, onError),
    { initialProps: old },
  );
  const runFrame = (frame: number) =>
    act(async () => {
      const callback = requestFrame.mock.lastCall?.[0];
      expect(callback).toBeTypeOf('function');
      requestFrame.mockClear();
      callback!(frame * (PREDICTION.INTERVAL_MS + 1));
      await vi.dynamicImportSettled();
    });

  act(() => result.current.startPredicting());
  await runFrame(1);
  expect(old.classifier.predictClass).toHaveBeenCalledExactlyOnceWith(old.features);
  rerender(next);
  retireModel(old.classifier);
  retireModel(old.model);
  await runFrame(2);
  expect(next.classifier.predictClass).not.toHaveBeenCalled();
  for (const resource of [oldPixels, old.features, old.classifier, old.model]) {
    expect(resource.dispose).not.toHaveBeenCalled();
  }

  await act(async () => pending.resolve({ label: 'stale', confidences: { stale: 1 } }));
  expect(result.current.prediction).toBeNull();
  for (const resource of [oldPixels, old.features, old.classifier, old.model]) {
    expect(resource.dispose).toHaveBeenCalledOnce();
  }
  expect(old.features.dispose).toHaveBeenCalledBefore(old.classifier.dispose);
  expect(old.features.dispose).toHaveBeenCalledBefore(old.model.dispose);

  await runFrame(3);
  expect(result.current.prediction).toEqual(nextPrediction);
  expect(onError).not.toHaveBeenCalled();
});
