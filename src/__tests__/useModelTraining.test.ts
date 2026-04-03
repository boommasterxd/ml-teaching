/**
 * useModelTraining.test.ts
 *
 * Unit tests for the useModelTraining hook. Covers derived validation flags
 * (canTrain, hasInvalidNames, hasDuplicateNames) and the trainModel procedure
 * including classifier disposal, creation, and error reporting.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModelTraining } from '../hooks/useModelTraining';
import { ML } from '../constants';
import type { MLClass } from '../types/ml';
import type { Classifier } from '../types/ml-models';

type SetClassifier = (c: Classifier) => void;
type TrainingOnError = (category: 'training' | 'validation', msg: string) => void;

// Mock TensorFlow.js — tensor1d wird im Training aufgerufen
vi.mock('@tensorflow/tfjs', () => ({
  tensor1d: vi.fn(() => ({ dispose: vi.fn() })),
}));

// Der neue Classifier, der von knnClassifier.create() zurückgegeben wird
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

/** Erzeugt N Klassen mit je `imagesPerClass` Dummy-Bildern. */
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
    it('ist false bei weniger als MIN_CLASSES Klassen', () => {
      const { result } = renderHook(() =>
        useModelTraining([makeClasses(1)[0]], null, { setClassifier, setHasTrainedModel, onError })
      );
      expect(result.current.canTrain).toBe(false);
    });

    it('ist false wenn Klassen zu wenig Bilder haben', () => {
      const classes = makeClasses(2, 0);
      const { result } = renderHook(() =>
        useModelTraining(classes, null, { setClassifier, setHasTrainedModel, onError })
      );
      expect(result.current.canTrain).toBe(false);
    });

    it('ist false bei leeren Klassennamen', () => {
      const classes = makeClasses(2);
      classes[0].name = '';
      const { result } = renderHook(() =>
        useModelTraining(classes, null, { setClassifier, setHasTrainedModel, onError })
      );
      expect(result.current.canTrain).toBe(false);
    });

    it('ist false bei doppelten Klassennamen', () => {
      const classes = makeClasses(2);
      classes[0].name = 'Gleich';
      classes[1].name = 'Gleich';
      const { result } = renderHook(() =>
        useModelTraining(classes, null, { setClassifier, setHasTrainedModel, onError })
      );
      expect(result.current.canTrain).toBe(false);
    });

    it('ist true bei ausreichend Klassen, Bildern und eindeutigen Namen', () => {
      const { result } = renderHook(() =>
        useModelTraining(makeClasses(2), null, { setClassifier, setHasTrainedModel, onError })
      );
      expect(result.current.canTrain).toBe(true);
    });
  });

  describe('hasInvalidNames', () => {
    it('erkennt leere Klassennamen', () => {
      const classes = makeClasses(2);
      classes[0].name = '';
      const { result } = renderHook(() =>
        useModelTraining(classes, null, { setClassifier, setHasTrainedModel, onError })
      );
      expect(result.current.hasInvalidNames).toBe(true);
    });

    it('erkennt Whitespace-only Namen', () => {
      const classes = makeClasses(2);
      classes[0].name = '   ';
      const { result } = renderHook(() =>
        useModelTraining(classes, null, { setClassifier, setHasTrainedModel, onError })
      );
      expect(result.current.hasInvalidNames).toBe(true);
    });

    it('ist false bei gültigen Namen', () => {
      const { result } = renderHook(() =>
        useModelTraining(makeClasses(2), null, { setClassifier, setHasTrainedModel, onError })
      );
      expect(result.current.hasInvalidNames).toBe(false);
    });
  });

  describe('hasDuplicateNames', () => {
    it('erkennt doppelte Klassennamen (nach trim)', () => {
      const classes = makeClasses(2);
      classes[0].name = ' Gleich ';
      classes[1].name = 'Gleich';
      const { result } = renderHook(() =>
        useModelTraining(classes, null, { setClassifier, setHasTrainedModel, onError })
      );
      expect(result.current.hasDuplicateNames).toBe(true);
    });

    it('ist false bei eindeutigen Namen', () => {
      const { result } = renderHook(() =>
        useModelTraining(makeClasses(3), null, { setClassifier, setHasTrainedModel, onError })
      );
      expect(result.current.hasDuplicateNames).toBe(false);
    });
  });

  describe('trainModel', () => {
    it('ruft onError auf wenn Mindestklassenanzahl nicht erreicht', async () => {
      const classes = makeClasses(1);
      const { result } = renderHook(() =>
        useModelTraining(classes, null, { setClassifier, setHasTrainedModel, onError })
      );

      await act(async () => { await result.current.trainModel(); });

      expect(onError).toHaveBeenCalledWith('validation', expect.stringContaining(String(ML.MIN_CLASSES)));
      expect(setClassifier).not.toHaveBeenCalled();
    });

    it('ruft onError auf wenn Klassen zu wenig Bilder haben', async () => {
      const classes = makeClasses(2, 0);
      const { result } = renderHook(() =>
        useModelTraining(classes, null, { setClassifier, setHasTrainedModel, onError })
      );

      await act(async () => { await result.current.trainModel(); });

      expect(onError).toHaveBeenCalledWith('validation', expect.any(String));
    });

    it('erstellt neuen Classifier und ruft setClassifier auf', async () => {
      const classes = makeClasses(2);
      const { result } = renderHook(() =>
        useModelTraining(classes, null, { setClassifier, setHasTrainedModel, onError })
      );

      await act(async () => { await result.current.trainModel(); });

      expect(setClassifier).toHaveBeenCalledWith(mockNewClassifier);
      expect(setHasTrainedModel).toHaveBeenCalledWith(true);
      expect(onError).not.toHaveBeenCalled();
    });

    it('disposed den alten Classifier vor dem Training', async () => {
      const disposeSpy = vi.fn();
      const oldClassifier: Classifier = {
        addExample: vi.fn(),
        predictClass: vi.fn().mockResolvedValue({ label: '', confidences: {} }),
        getNumClasses: vi.fn(() => 0),
        dispose: disposeSpy,
        clearAllClasses: vi.fn(),
      };
      const classes = makeClasses(2);
      const { result } = renderHook(() =>
        useModelTraining(classes, oldClassifier, { setClassifier, setHasTrainedModel, onError })
      );

      await act(async () => { await result.current.trainModel(); });

      expect(disposeSpy).toHaveBeenCalledOnce();
    });

    it('isTraining ist false nach abgeschlossenem Training', async () => {
      const classes = makeClasses(2);
      const { result } = renderHook(() =>
        useModelTraining(classes, null, { setClassifier, setHasTrainedModel, onError })
      );

      expect(result.current.isTraining).toBe(false);
      await act(async () => { await result.current.trainModel(); });
      expect(result.current.isTraining).toBe(false);
    });

    it('ruft onError mit "training" auf wenn trainClassifier wirft', async () => {
      const tfMock = await import('@tensorflow/tfjs');
      vi.mocked(tfMock.tensor1d).mockImplementationOnce(() => { throw new Error('GPU-Fehler'); });

      const classes = makeClasses(2);
      const { result } = renderHook(() =>
        useModelTraining(classes, null, { setClassifier, setHasTrainedModel, onError })
      );

      await act(async () => { await result.current.trainModel(); });

      expect(console.error).toHaveBeenCalledWith('Training error:', expect.any(Error));
      expect(onError).toHaveBeenCalledWith('training', 'Fehler beim Training des Modells.');
      expect(mockNewClassifier.dispose).toHaveBeenCalled();
      expect(result.current.isTraining).toBe(false);
    });
  });
});
