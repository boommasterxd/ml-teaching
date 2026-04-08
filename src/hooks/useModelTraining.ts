/**
 * useModelTraining.ts
 *
 * React hook that validates training prerequisites and trains a KNN classifier
 * from collected image feature vectors. Exposes training state and derived
 * validation flags so the UI can reflect readiness and progress.
 */
import { useState, useCallback, useMemo } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
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

/**
 * Trains a new KNN classifier by adding all stored feature vectors class by class.
 * Each tensor is disposed immediately after use to prevent GPU memory leaks.
 * Yields to the browser every TRAINING_BATCH_SIZE iterations to keep the UI responsive.
 */
async function trainClassifier(classes: MLClass[], newClassifier: Classifier): Promise<void> {
  let count = 0;
  for (const cls of classes) {
    for (const img of cls.images) {
      const tensor = tf.tensor1d(img.featureArray);
      newClassifier.addExample(tensor, cls.id);
      tensor.dispose();
      count++;
      if (count % ML.TRAINING_BATCH_SIZE === 0) {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
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
  onError: (category: Extract<ErrorCategory, 'training' | 'validation'>, msg: string) => void
): boolean {
  if (classes.length < ML.MIN_CLASSES) {
    onError('validation', `Du brauchst mindestens ${ML.MIN_CLASSES} Klassen, um ein Modell zu trainieren.`);
    return false;
  }
  const classesWithFewImages = classes.filter(c => c.images.length < ML.MIN_IMAGES_PER_CLASS);
  if (classesWithFewImages.length > 0) {
    const names = classesWithFewImages
      .map(c => `"${c.name || 'Ohne Namen'}" (${c.images.length} Bilder)`)
      .join(', ');
    onError('validation', `Zu wenig Bilder: ${names}. Jede Klasse braucht mindestens ${ML.MIN_IMAGES_PER_CLASS} Bilder.`);
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
 * @param classifier - The current KNN classifier instance, or null if none exists yet.
 * @param callbacks - Grouped callbacks for updating parent state and reporting errors.
 * @param hasDuplicateNames - Pre-computed flag: true when two or more classes share the same trimmed name.
 *   Passed in from the caller to avoid recomputing what is already derived from `duplicateClassNames`.
 * @returns An object with the training state flag, the train function, and derived validation flags.
 */
export function useModelTraining(
  classes: MLClass[],
  classifier: Classifier | null,
  callbacks: TrainingCallbacks,
  hasDuplicateNames: boolean,
) {
  const { setClassifier, setHasTrainedModel, onError } = callbacks;
  const [isTraining, setIsTraining] = useState(false);

  /** True when at least one class has an empty or whitespace-only name. */
  const hasInvalidNames = useMemo(
    () => classes.some(c => c.name.trim() === ''),
    [classes]
  );

  /**
   * True when all training prerequisites are met: minimum class count,
   * minimum images per class, no invalid names, and no duplicate names.
   */
  const canTrain = useMemo(
    () =>
      classes.length >= ML.MIN_CLASSES &&
      classes.every(c => c.images.length >= ML.MIN_IMAGES_PER_CLASS) &&
      !hasInvalidNames &&
      !hasDuplicateNames,
    [classes, hasInvalidNames, hasDuplicateNames]
  );

  /**
   * Validates all prerequisites and trains a new KNN classifier from the
   * stored feature vectors. Disposes the previous classifier before creating
   * a new one. Reports validation or training errors via `onError` and
   * updates `isTraining` throughout the async operation.
   */
  const trainModel = useCallback(async () => {
    if (!validateClasses(classes, hasInvalidNames, hasDuplicateNames, onError)) return;

    setIsTraining(true);

    if (classifier) {
      classifier.dispose();
    }

    const newClassifier = knnClassifier.create();
    // Yield to the browser for one render cycle so the isTraining state
    // propagates and the loading spinner becomes visible before the
    // synchronous KNN training loop blocks the main thread.
    await new Promise(resolve => setTimeout(resolve, ML.TRAINING_UI_YIELD_MS));

    try {
      await trainClassifier(classes, newClassifier);

      setClassifier(newClassifier);
      setHasTrainedModel(true);
      setIsTraining(false);
    } catch (err) {
      console.error('Training error:', err);
      newClassifier.dispose();
      onError('training', 'Fehler beim Training des Modells.');
      setIsTraining(false);
    }
  }, [classes, classifier, setClassifier, setHasTrainedModel, onError, hasInvalidNames, hasDuplicateNames]);

  return { isTraining, trainModel, canTrain, hasInvalidNames };
}
