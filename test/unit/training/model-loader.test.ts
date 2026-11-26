import { act, renderHook, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useModelLoader } from '@/hooks/useModelLoader';
import type { Classifier, FeatureExtractor } from '@/types/ml-models';

function classifier(): Classifier {
  return {
    addExample: vi.fn(),
    predictClass: vi.fn(),
    getNumClasses: vi.fn(),
    setClassifierDataset: vi.fn(),
    dispose: vi.fn(),
  };
}

function extractor(): FeatureExtractor {
  return { infer: vi.fn(), dispose: vi.fn() };
}

it('aborts a model download on withdrawal, disposes its late graph and resumes only after reentry', async () => {
  const download = Promise.withResolvers<FeatureExtractor>();
  const abandoned = extractor();
  const fresh = extractor();
  const initialClassifier = classifier();
  const activeClassifier = classifier();
  const load = vi
    .fn<(_setText: (text: string) => void, signal: AbortSignal) => Promise<FeatureExtractor>>()
    .mockReturnValueOnce(download.promise)
    .mockResolvedValueOnce(fresh);
  const loaders = {
    initBackend: async () => {},
    warmup: async () => {},
    createClassifier: vi
      .fn()
      .mockResolvedValueOnce(initialClassifier)
      .mockResolvedValueOnce(activeClassifier),
    loadFeatureExtractor: load,
  };
  const onError = vi.fn();
  const { result, rerender } = renderHook(
    ({ consent }) => useModelLoader(consent, onError, loaders),
    { initialProps: { consent: true } },
  );
  await waitFor(() => expect(load).toHaveBeenCalledOnce());
  const [, signal] = load.mock.calls[0];
  rerender({ consent: false });
  expect(signal.aborted).toBe(true);
  expect(result.current.mobilenetModel).toBeNull();

  await act(async () => rerender({ consent: true }));
  expect(load).toHaveBeenCalledOnce();
  await act(async () => download.resolve(abandoned));
  expect(abandoned.dispose).toHaveBeenCalledOnce();
  expect(initialClassifier.dispose).toHaveBeenCalledOnce();
  expect(result.current.mobilenetModel).toBe(fresh);
  expect(result.current.classifier).toBe(activeClassifier);
  expect(onError).not.toHaveBeenCalled();

  rerender({ consent: false });
  expect(fresh.dispose).toHaveBeenCalledOnce();
  expect(activeClassifier.dispose).toHaveBeenCalledOnce();
});
