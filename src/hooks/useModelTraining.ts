/**
 * useModelTraining.ts
 *
 * React hook that validates training prerequisites and trains a KNN classifier
 * from collected image feature vectors. Exposes training state and derived
 * validation flags so the UI can reflect readiness and progress.
 */
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createClassifier, loadTensorFlow } from '../lib/ml-runtime';
import type { MLClass } from '../types/ml';
import { ML } from '../constants';
import type { ErrorCategory } from '../types/errors';
import type { Classifier } from '../types/ml-models';

/**
 * Grouped callbacks passed to {@link useModelTraining} to report results
 * and update parent state after a training run.
 */
export interface TrainingCallbacks {
  setClassifier: (c: Classifier) => void;
  setHasTrainedModel: (v: boolean) => void;
  onError: (category: Extract<ErrorCategory, 'training' | 'validation'>, msg: string) => void;
}

export interface TrainingProgress {
  processed: number;
  total: number;
}

const progressIntervalMs = 100;

/**
 * Trains a new KNN classifier by adding all stored feature vectors class by class.
 * Each tensor is disposed immediately after use to prevent GPU memory leaks.
 * Yields to the browser every TRAINING_BATCH_SIZE iterations to keep the UI responsive.
 */
async function trainClassifier(
  classes: MLClass[],
  newClassifier: Classifier,
  signal: AbortSignal,
  onBatch: (processed: number) => void,
): Promise<void> {
  const tf = await loadTensorFlow();
  let count = 0;
  for (const cls of classes) {
    for (const img of cls.images) {
      signal.throwIfAborted();
      const tensor = tf.tensor1d(img.featureArray);
      try {
        newClassifier.addExample(tensor, cls.id);
      } finally {
        tensor.dispose();
      }
      count++;
      if (count % ML.TRAINING_BATCH_SIZE === 0) {
        onBatch(count);
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
    }
  }
}

/**
 * Validates all training prerequisites and reports the first encountered error.
 *
 * @returns `true` when all prerequisites are met, `false` when an error was reported.
 */
function validateClasses(
  classes: MLClass[],
  hasInvalidNames: boolean,
  hasDuplicateNames: boolean,
  onError: (category: Extract<ErrorCategory, 'training' | 'validation'>, msg: string) => void,
): boolean {
  if (classes.length < ML.MIN_CLASSES) {
    onError(
      'validation',
      `Du brauchst mindestens ${ML.MIN_CLASSES} Klassen, um ein Modell zu trainieren.`,
    );
    return false;
  }
  const classesWithFewImages = classes.filter((c) => c.images.length < ML.MIN_IMAGES_PER_CLASS);
  if (classesWithFewImages.length > 0) {
    const names = classesWithFewImages
      .map((c) => `"${c.name || 'Ohne Namen'}" (${c.images.length} Bilder)`)
      .join(', ');
    onError(
      'validation',
      `Zu wenig Bilder: ${names}. Jede Klasse braucht mindestens ${ML.MIN_IMAGES_PER_CLASS} Bilder.`,
    );
    return false;
  }
  if (hasInvalidNames) {
    onError('validation', 'Bitte gib allen Klassen einen Namen.');
    return false;
  }
  if (hasDuplicateNames) {
    onError('validation', 'Bitte gib allen Klassen einen eindeutigen Namen.');
    return false;
  }
  return true;
}

/**
 * Manages training state, input validation, and the KNN training procedure.
 *
 * @param classes - The list of ML classes, each carrying its captured images and feature vectors.
 * @param callbacks - Grouped callbacks for updating parent state and reporting errors.
 * @param hasDuplicateNames - Pre-computed flag: true when two or more classes share the same trimmed name.
 *   Passed in from the caller to avoid recomputing what is already derived from `duplicateClassNames`.
 * @returns An object with the training state flag, the train function, and derived validation flags.
 */
export function useModelTraining(
  classes: MLClass[],
  callbacks: TrainingCallbacks,
  hasDuplicateNames: boolean,
) {
  const { setClassifier, setHasTrainedModel, onError } = callbacks;
  const [progress, setProgress] = useState<TrainingProgress | null>(null);
  const trainingRef = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      trainingRef.current?.abort();
    },
    [classes],
  );

  /** True when at least one class has an empty or whitespace-only name. */
  const hasInvalidNames = useMemo(() => classes.some((c) => c.name.trim() === ''), [classes]);

  /**
   * True when all training prerequisites are met: minimum class count,
   * minimum images per class, no invalid names, and no duplicate names.
   */
  const canTrain = useMemo(
    () =>
      classes.length >= ML.MIN_CLASSES &&
      classes.every((c) => c.images.length >= ML.MIN_IMAGES_PER_CLASS) &&
      !hasInvalidNames &&
      !hasDuplicateNames,
    [classes, hasInvalidNames, hasDuplicateNames],
  );

  /**
   * Validates all prerequisites and trains a new KNN classifier from the
   * stored feature vectors. The model loader owns replacement and disposal.
   * Reports validation or training errors via `onError` and
   * reports registered images while the async operation is active.
   */
  const trainModel = useCallback(async () => {
    if (trainingRef.current && !trainingRef.current.signal.aborted) return;
    if (!validateClasses(classes, hasInvalidNames, hasDuplicateNames, onError)) return;
    const controller = new AbortController();
    trainingRef.current = controller;
    const total = classes.reduce((count, cls) => count + cls.images.length, 0);
    setProgress({ processed: 0, total });
    let nextProgressAt = 0;
    let newClassifier: Classifier | null = null;
    try {
      newClassifier = await createClassifier();
      await new Promise((resolve) => setTimeout(resolve, ML.TRAINING_UI_YIELD_MS));
      await trainClassifier(classes, newClassifier, controller.signal, (processed) => {
        const now = performance.now();
        if (now < nextProgressAt) return;
        nextProgressAt = now + progressIntervalMs;
        setProgress({ processed, total });
      });
      controller.signal.throwIfAborted();
      setClassifier(newClassifier);
      newClassifier = null;
      setHasTrainedModel(true);
    } catch {
      newClassifier?.dispose();
      if (!controller.signal.aborted) onError('training', 'Fehler beim Training des Modells.');
    } finally {
      if (trainingRef.current === controller) {
        trainingRef.current = null;
        setProgress(null);
      }
    }
  }, [classes, setClassifier, setHasTrainedModel, onError, hasInvalidNames, hasDuplicateNames]);

  const isTrainingActive = useCallback(
    () => Boolean(trainingRef.current && !trainingRef.current.signal.aborted),
    [],
  );
  return {
    isTraining: progress !== null,
    progress,
    isTrainingActive,
    trainModel,
    canTrain,
    hasInvalidNames,
  };
}
