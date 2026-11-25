/**
 * useModelTraining.test.ts
 *
 * Unit tests for the useModelTraining hook. Covers derived validation flags
 * (canTrain, hasInvalidNames, hasDuplicateNames) and the trainModel procedure
 * including classifier disposal, creation, and error reporting.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModelTraining, type TrainingCallbacks } from '@/hooks/useModelTraining';
import { ANIMATION, ML } from '@/constants';
import { createClassNameValidator } from '@/lib/training-class-names';
import type { MLClass } from '@/types/ml';
import type { Classifier } from '@/types/ml-models';

/** Callback type for updating the active KNN classifier instance. */
type SetClassifier = (c: Classifier) => void;

/** Callback type for reporting training or validation errors. */
type TrainingOnError = (category: 'training' | 'validation', msg: string) => void;

vi.mock('@tensorflow/tfjs-core', () => ({
  tensor2d: vi.fn(() => ({ dispose: vi.fn() })),
  norm: vi.fn(),
  div: vi.fn((examples) => examples),
  tidy: (run: () => unknown) => run(),
  dispose: vi.fn(),
}));

/**
 * Shared mock classifier returned by `knnClassifier.create()` after each training run.
 * All methods are jest/vitest fns so call counts can be asserted in tests.
 */
const mockNewClassifier: Classifier = {
  addExample: vi.fn(),
  predictClass: vi.fn(),
  getNumClasses: vi.fn(() => 0),
  dispose: vi.fn(),
  setClassifierDataset: vi.fn(),
};

vi.mock('@tensorflow-models/knn-classifier', () => ({
  create: vi.fn(() => mockNewClassifier),
}));

/**
 * Creates an array of N MLClass objects, each containing `imagesPerClass` dummy images
 * with placeholder feature arrays. Cycles through a fixed color palette.
 *
 * @param count - Number of classes to generate.
 * @param imagesPerClass - Number of images per class (defaults to ML.MIN_IMAGES_PER_CLASS).
 * @returns Array of MLClass objects ready for use in hook tests.
 */
function makeClasses(count: number, imagesPerClass: number = ML.MIN_IMAGES_PER_CLASS): MLClass[] {
  const colors = ['#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777'];
  return Array.from({ length: count }, (_, i) => ({
    id: `class-${i}`,
    name: `Klasse ${i + 1}`,
    color: colors[i % colors.length],
    images: Array.from({ length: imagesPerClass }, (__, j) => ({
      id: `img-${i}-${j}`,
      dataUrl: 'data:image/png;base64,abc',
      featureArray: [0.1, 0.2],
    })),
  }));
}

function useTrainingFixture(classes: MLClass[], callbacks: TrainingCallbacks) {
  const names = classes.map(({ id, name }) => ({ classId: id, name }));
  const { validity } = createClassNameValidator()({ names });
  return useModelTraining(classes, callbacks, { current: validity, read: () => validity });
}

describe('useModelTraining', () => {
  let setClassifier: SetClassifier;
  let setHasTrainedModel: (v: boolean) => void;
  let onError: TrainingOnError;

  beforeEach(() => {
    setClassifier = vi.fn() as unknown as SetClassifier;
    setHasTrainedModel = vi.fn() as unknown as (v: boolean) => void;
    onError = vi.fn() as unknown as TrainingOnError;
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('canTrain', () => {
    it('is false when fewer than MIN_CLASSES classes are provided', () => {
      const { result } = renderHook(() =>
        useTrainingFixture([makeClasses(1)[0]], { setClassifier, setHasTrainedModel, onError }),
      );
      expect(result.current.canTrain).toBe(false);
    });

    it('is false when classes have fewer than the minimum number of images', () => {
      const classes = makeClasses(2, 0);
      const { result } = renderHook(() =>
        useTrainingFixture(classes, { setClassifier, setHasTrainedModel, onError }),
      );
      expect(result.current.canTrain).toBe(false);
    });

    it('is false when a class name is empty', () => {
      const classes = makeClasses(2);
      classes[0].name = '';
      const { result } = renderHook(() =>
        useTrainingFixture(classes, { setClassifier, setHasTrainedModel, onError }),
      );
      expect(result.current.canTrain).toBe(false);
    });

    it('is false when class names match after trimming', () => {
      const classes = makeClasses(2);
      classes[1].name = ` ${classes[0].name} `;
      const { result } = renderHook(() =>
        useTrainingFixture(classes, { setClassifier, setHasTrainedModel, onError }),
      );
      expect(result.current.canTrain).toBe(false);
      expect(result.current.hasDuplicateNames).toBe(true);
    });

    it('is true when enough classes, images, and unique names are provided', () => {
      const { result } = renderHook(() =>
        useTrainingFixture(makeClasses(2), { setClassifier, setHasTrainedModel, onError }),
      );
      expect(result.current.canTrain).toBe(true);
    });
  });

  describe('hasInvalidNames', () => {
    it('detects empty class names', () => {
      const classes = makeClasses(2);
      classes[0].name = '';
      const { result } = renderHook(() =>
        useTrainingFixture(classes, { setClassifier, setHasTrainedModel, onError }),
      );
      expect(result.current.hasInvalidNames).toBe(true);
    });

    it('detects whitespace-only names', () => {
      const classes = makeClasses(2);
      classes[0].name = '   ';
      const { result } = renderHook(() =>
        useTrainingFixture(classes, { setClassifier, setHasTrainedModel, onError }),
      );
      expect(result.current.hasInvalidNames).toBe(true);
    });

    it('is false when all names are valid', () => {
      const { result } = renderHook(() =>
        useTrainingFixture(makeClasses(2), { setClassifier, setHasTrainedModel, onError }),
      );
      expect(result.current.hasInvalidNames).toBe(false);
    });
  });

  describe('trainModel', () => {
    it('rejects training with duplicate class names', async () => {
      const classes = makeClasses(2);
      classes[1].name = classes[0].name;
      const { result } = renderHook(() =>
        useTrainingFixture(classes, { setClassifier, setHasTrainedModel, onError }),
      );
      await act(async () => {
        await result.current.trainModel();
      });
      expect(onError).toHaveBeenCalledWith('validation', 'Gib jeder Klasse einen eigenen Namen.');
      expect(setClassifier).not.toHaveBeenCalled();
    });
    it('calls onError when the minimum class count is not reached', async () => {
      const classes = makeClasses(1);
      const { result } = renderHook(() =>
        useTrainingFixture(classes, { setClassifier, setHasTrainedModel, onError }),
      );

      await act(async () => {
        await result.current.trainModel();
      });

      expect(onError).toHaveBeenCalledWith(
        'validation',
        expect.stringContaining(String(ML.MIN_CLASSES)),
      );
      expect(setClassifier).not.toHaveBeenCalled();
    });

    it('calls onError when classes have too few images', async () => {
      const classes = makeClasses(2, 0);
      const { result } = renderHook(() =>
        useTrainingFixture(classes, { setClassifier, setHasTrainedModel, onError }),
      );

      await act(async () => {
        await result.current.trainModel();
      });

      expect(onError).toHaveBeenCalledWith('validation', expect.any(String));
    });

    it('creates a new classifier and calls setClassifier on successful training', async () => {
      const classes = makeClasses(2);
      const { result } = renderHook(() =>
        useTrainingFixture(classes, { setClassifier, setHasTrainedModel, onError }),
      );

      await act(async () => {
        await result.current.trainModel();
      });

      expect(setClassifier).toHaveBeenCalledWith(mockNewClassifier);
      expect(setHasTrainedModel).toHaveBeenCalledWith(true);
      expect(onError).not.toHaveBeenCalled();
    });

    it('reports progress and installs just one normalized matrix per class', async () => {
      const classes = makeClasses(2, 20);
      const tfMock = await import('@tensorflow/tfjs-core');
      vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
      const { result } = renderHook(() =>
        useTrainingFixture(classes, { setClassifier, setHasTrainedModel, onError }),
      );
      vi.useFakeTimers();
      try {
        let training!: Promise<void>;
        await act(async () => {
          training = result.current.trainModel(
            ANIMATION.TRAINING_PROGRESS_FILL_MS + ANIMATION.TRAINING_PROGRESS_REST_MS,
          );
          await vi.dynamicImportSettled();
        });
        expect(result.current.progress).toEqual({ processed: 0, total: 40 });

        await act(async () => {
          await vi.advanceTimersByTimeAsync(ML.TRAINING_UI_YIELD_MS);
        });
        expect(result.current.progress).toEqual({ processed: 40, total: 40 });
        expect(mockNewClassifier.setClassifierDataset).toHaveBeenCalledOnce();
        expect(setClassifier).not.toHaveBeenCalled();

        await act(async () => {
          await vi.advanceTimersByTimeAsync(ANIMATION.TRAINING_PROGRESS_FILL_MS);
        });
        expect(result.current.isTraining).toBe(true);
        expect(setHasTrainedModel).not.toHaveBeenCalled();

        await act(async () => {
          await vi.runAllTimersAsync();
          await training;
        });
        expect(result.current.progress).toBeNull();
        expect(tfMock.tensor2d).toHaveBeenCalledTimes(2);
        expect(tfMock.tensor2d).toHaveBeenCalledWith(
          Float32Array.from(classes[0].images.flatMap((item) => item.featureArray)),
          [20, 2],
        );
        expect(tfMock.norm).toHaveBeenCalledTimes(2);
        expect(tfMock.norm).toHaveBeenCalledWith(expect.any(Object), 'euclidean', 1, true);
        expect(mockNewClassifier.setClassifierDataset).toHaveBeenCalledExactlyOnceWith({
          'class-0': expect.any(Object),
          'class-1': expect.any(Object),
        });
        expect(setClassifier).toHaveBeenCalledExactlyOnceWith(mockNewClassifier);
      } finally {
        vi.useRealTimers();
      }
    });

    it('isTraining is false after training completes', async () => {
      const classes = makeClasses(2);
      const { result } = renderHook(() =>
        useTrainingFixture(classes, { setClassifier, setHasTrainedModel, onError }),
      );

      expect(result.current.isTraining).toBe(false);
      await act(async () => {
        await result.current.trainModel();
      });
      expect(result.current.isTraining).toBe(false);
    });

    it('releases partially built matrices when training fails and keeps the run unpublished', async () => {
      const tfMock = await import('@tensorflow/tfjs-core');
      const firstMatrix = { dispose: vi.fn() };
      vi.mocked(tfMock.tensor2d)
        .mockReturnValueOnce(firstMatrix as never)
        .mockImplementationOnce(() => {
          throw new Error('GPU-Fehler');
        });

      const classes = makeClasses(2);
      const { result } = renderHook(() =>
        useTrainingFixture(classes, { setClassifier, setHasTrainedModel, onError }),
      );

      await act(async () => {
        await result.current.trainModel();
      });

      expect(onError).toHaveBeenCalledWith('training', 'Fehler beim Training des Modells.');
      expect(tfMock.dispose).toHaveBeenCalledExactlyOnceWith({ 'class-0': firstMatrix });
      expect(mockNewClassifier.dispose).toHaveBeenCalled();
      expect(setClassifier).not.toHaveBeenCalled();
      expect(result.current.isTraining).toBe(false);
    });

    it('coalesces repeated training requests while one is active', async () => {
      const classes = makeClasses(2);
      const { result } = renderHook(() =>
        useTrainingFixture(classes, { setClassifier, setHasTrainedModel, onError }),
      );
      await act(async () => {
        await Promise.all([result.current.trainModel(), result.current.trainModel()]);
      });
      expect(setClassifier).toHaveBeenCalledOnce();
    });

    it('discards the finished candidate when its source classes change during feedback', async () => {
      const classes = makeClasses(2);
      const { result, rerender } = renderHook(
        ({ data }) => useTrainingFixture(data, { setClassifier, setHasTrainedModel, onError }),
        { initialProps: { data: classes } },
      );
      vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
      vi.useFakeTimers();
      try {
        let training!: Promise<void>;
        await act(async () => {
          training = result.current.trainModel(ANIMATION.TRAINING_PROGRESS_FILL_MS);
          await vi.dynamicImportSettled();
          await vi.advanceTimersByTimeAsync(ML.TRAINING_UI_YIELD_MS);
        });
        expect(result.current.progress).toEqual({ processed: 20, total: 20 });
        rerender({ data: makeClasses(2, 0) });
        await act(async () => await training);
        expect(result.current.progress).toBeNull();
        expect(setClassifier).not.toHaveBeenCalled();
        expect(setHasTrainedModel).not.toHaveBeenCalled();
        expect(mockNewClassifier.dispose).toHaveBeenCalledOnce();
        expect(onError).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
