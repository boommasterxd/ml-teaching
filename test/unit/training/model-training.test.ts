import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ANIMATION, ML } from '@/constants';
import { useModelTraining, type TrainingCallbacks } from '@/hooks/useModelTraining';
import { createClassNameValidator } from '@/lib/training-class-names';
import type { MLClass } from '@/types/ml';

vi.mock('@tensorflow/tfjs-core', () => ({
  tensor2d: vi.fn(),
  norm: vi.fn(),
  div: vi.fn(),
  tidy: (run: () => unknown) => run(),
}));

const candidate = vi.hoisted(() => ({ dispose: vi.fn(), setClassifierDataset: vi.fn() }));
vi.mock('@tensorflow-models/knn-classifier', () => ({ create: () => candidate }));

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function classes(): MLClass[] {
  return ['Cat', 'Dog'].map((name) => ({
    id: name.toLowerCase(),
    name,
    color: '#dc2626',
    images: Array.from({ length: ML.MIN_IMAGES_PER_CLASS }, (_, index) => ({
      id: `${name}-${index}`,
      dataUrl: 'data:image/png;base64,fixture',
      featureArray: name === 'Cat' ? [1, 0] : [0, 1],
    })),
  }));
}

function useTraining(data: MLClass[], callbacks: TrainingCallbacks) {
  const names = data.map(({ id, name }) => ({ classId: id, name }));
  const { validity } = createClassNameValidator()({ names });
  return useModelTraining(data, callbacks, { current: validity, read: () => validity });
}

function callbacks() {
  return { setClassifier: vi.fn(), setHasTrainedModel: vi.fn(), onError: vi.fn() };
}

it('blocks a training request that would assign conflicting names to separate classes', async () => {
  const data = classes();
  data[1].name = ` ${data[0].name} `;
  const report = callbacks();
  const { result } = renderHook(() => useTraining(data, report));

  await act(() => result.current.trainModel());
  expect(result.current.canTrain).toBe(false);
  expect(report.onError).toHaveBeenCalledWith(
    'validation',
    'Gib jeder Klasse einen eigenen Namen.',
  );
  expect(candidate.setClassifierDataset).not.toHaveBeenCalled();
  expect(report.setClassifier).not.toHaveBeenCalled();
});

it('disposes a candidate before it can publish against changed training examples', async () => {
  const report = callbacks();
  const data = classes();
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  vi.useFakeTimers();
  const { result, rerender } = renderHook(({ samples }) => useTraining(samples, report), {
    initialProps: { samples: data },
  });

  let training!: Promise<void>;
  await act(async () => {
    training = result.current.trainModel(ANIMATION.TRAINING_PROGRESS_FILL_MS);
    await vi.dynamicImportSettled();
    await vi.advanceTimersByTimeAsync(ML.TRAINING_UI_YIELD_MS);
  });
  expect(candidate.setClassifierDataset).toHaveBeenCalledOnce();
  expect(report.setClassifier).not.toHaveBeenCalled();

  rerender({ samples: [{ ...data[0], images: data[0].images.slice(1) }, data[1]] });
  await act(() => training);
  expect(result.current.isTraining).toBe(false);
  expect(candidate.dispose).toHaveBeenCalledOnce();
  expect(report.setClassifier).not.toHaveBeenCalled();
  expect(report.setHasTrainedModel).not.toHaveBeenCalled();
  expect(report.onError).not.toHaveBeenCalled();
});
