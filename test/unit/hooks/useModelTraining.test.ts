/**
 * useModelTraining.test.ts
 *
 * Unit tests for the useModelTraining hook. Covers derived validation flags
 * (canTrain, hasInvalidNames, hasDuplicateNames) and the trainModel procedure
 * including classifier disposal, creation, and error reporting.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModelTraining } from '@/hooks/useModelTraining';
import { ML } from '@/constants';
import type { MLClass } from '@/types/ml';
import type { Classifier } from '@/types/ml-models';

/** Callback type for updating the active KNN classifier instance. */
type SetClassifier = (c: Classifier) => void;

/** Callback type for reporting training or validation errors. */
type TrainingOnError = (category: 'training' | 'validation', msg: string) => void;

// Mock TensorFlow.js — tensor1d is called during training to wrap feature arrays.
vi.mock('@tensorflow/tfjs-core', () => ({
  tensor1d: vi.fn(() => ({ dispose: vi.fn() })),
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
  clearAllClasses: vi.fn(),
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
        useModelTraining(
          [makeClasses(1)[0]],
          { setClassifier, setHasTrainedModel, onError },
          false,
        ),
      );
      expect(result.current.canTrain).toBe(false);
    });

    it('is false when classes have fewer than the minimum number of images', () => {
      const classes = makeClasses(2, 0);
      const { result } = renderHook(() =>
        useModelTraining(classes, { setClassifier, setHasTrainedModel, onError }, false),
      );
      expect(result.current.canTrain).toBe(false);
    });

    it('is false when a class name is empty', () => {
      const classes = makeClasses(2);
      classes[0].name = '';
      const { result } = renderHook(() =>
        useModelTraining(classes, { setClassifier, setHasTrainedModel, onError }, false),
      );
      expect(result.current.canTrain).toBe(false);
    });

    it('is false when hasDuplicateNames is true', () => {
      const classes = makeClasses(2);
      const { result } = renderHook(() =>
        useModelTraining(classes, { setClassifier, setHasTrainedModel, onError }, true),
      );
      expect(result.current.canTrain).toBe(false);
    });

    it('is true when enough classes, images, and unique names are provided', () => {
      const { result } = renderHook(() =>
        useModelTraining(makeClasses(2), { setClassifier, setHasTrainedModel, onError }, false),
      );
      expect(result.current.canTrain).toBe(true);
    });
  });

  describe('hasInvalidNames', () => {
    it('detects empty class names', () => {
      const classes = makeClasses(2);
      classes[0].name = '';
      const { result } = renderHook(() =>
        useModelTraining(classes, { setClassifier, setHasTrainedModel, onError }, false),
      );
      expect(result.current.hasInvalidNames).toBe(true);
    });

    it('detects whitespace-only names', () => {
      const classes = makeClasses(2);
      classes[0].name = '   ';
      const { result } = renderHook(() =>
        useModelTraining(classes, { setClassifier, setHasTrainedModel, onError }, false),
      );
      expect(result.current.hasInvalidNames).toBe(true);
    });

    it('is false when all names are valid', () => {
      const { result } = renderHook(() =>
        useModelTraining(makeClasses(2), { setClassifier, setHasTrainedModel, onError }, false),
      );
      expect(result.current.hasInvalidNames).toBe(false);
    });
  });

  describe('hasDuplicateNames parameter', () => {
    it('canTrain is false when hasDuplicateNames=true is passed', () => {
      const { result } = renderHook(() =>
        useModelTraining(makeClasses(2), { setClassifier, setHasTrainedModel, onError }, true),
      );
      expect(result.current.canTrain).toBe(false);
    });

    it('trainModel calls onError with validation when hasDuplicateNames=true is passed', async () => {
      const { result } = renderHook(() =>
        useModelTraining(makeClasses(2), { setClassifier, setHasTrainedModel, onError }, true),
      );
      await act(async () => {
        await result.current.trainModel();
      });
      expect(onError).toHaveBeenCalledWith('validation', expect.stringContaining('eindeutigen'));
      expect(setClassifier).not.toHaveBeenCalled();
    });
  });

  describe('trainModel', () => {
    it('calls onError when the minimum class count is not reached', async () => {
      const classes = makeClasses(1);
      const { result } = renderHook(() =>
        useModelTraining(classes, { setClassifier, setHasTrainedModel, onError }, false),
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
        useModelTraining(classes, { setClassifier, setHasTrainedModel, onError }, false),
      );

      await act(async () => {
        await result.current.trainModel();
      });

      expect(onError).toHaveBeenCalledWith('validation', expect.any(String));
    });

    it('creates a new classifier and calls setClassifier on successful training', async () => {
      const classes = makeClasses(2);
      const { result } = renderHook(() =>
        useModelTraining(classes, { setClassifier, setHasTrainedModel, onError }, false),
      );

      await act(async () => {
        await result.current.trainModel();
      });

      expect(setClassifier).toHaveBeenCalledWith(mockNewClassifier);
      expect(setHasTrainedModel).toHaveBeenCalledWith(true);
      expect(onError).not.toHaveBeenCalled();
    });

    it('isTraining is false after training completes', async () => {
      const classes = makeClasses(2);
      const { result } = renderHook(() =>
        useModelTraining(classes, { setClassifier, setHasTrainedModel, onError }, false),
      );

      expect(result.current.isTraining).toBe(false);
      await act(async () => {
        await result.current.trainModel();
      });
      expect(result.current.isTraining).toBe(false);
    });

    it('calls onError with category "training" when the classifier throws during training', async () => {
      const tfMock = await import('@tensorflow/tfjs-core');
      vi.mocked(tfMock.tensor1d).mockImplementationOnce(() => {
        throw new Error('GPU-Fehler');
      });

      const classes = makeClasses(2);
      const { result } = renderHook(() =>
        useModelTraining(classes, { setClassifier, setHasTrainedModel, onError }, false),
      );

      await act(async () => {
        await result.current.trainModel();
      });

      expect(onError).toHaveBeenCalledWith('training', 'Fehler beim Training des Modells.');
      expect(mockNewClassifier.dispose).toHaveBeenCalled();
      expect(result.current.isTraining).toBe(false);
    });

    it('coalesces repeated training requests while one is active', async () => {
      const classes = makeClasses(2);
      const { result } = renderHook(() =>
        useModelTraining(classes, { setClassifier, setHasTrainedModel, onError }, false),
      );
      await act(async () => {
        await Promise.all([result.current.trainModel(), result.current.trainModel()]);
      });
      expect(setClassifier).toHaveBeenCalledOnce();
    });

    it('discards training when its source classes change', async () => {
      const classes = makeClasses(2);
      const { result, rerender } = renderHook(
        ({ data }) => useModelTraining(data, { setClassifier, setHasTrainedModel, onError }, false),
        { initialProps: { data: classes } },
      );
      let training!: Promise<void>;
      act(() => {
        training = result.current.trainModel();
      });
      rerender({ data: makeClasses(2, 0) });
      await act(async () => {
        await training;
      });
      expect(setClassifier).not.toHaveBeenCalled();
      expect(setHasTrainedModel).not.toHaveBeenCalled();
      expect(mockNewClassifier.dispose).toHaveBeenCalledOnce();
      expect(onError).not.toHaveBeenCalled();
    });
  });
});
