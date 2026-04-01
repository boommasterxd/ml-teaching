/**
 * useModelTraining.ts
 *
 * React hook that validates training prerequisites and trains a KNN classifier
 * from collected image feature vectors. Exposes training state and derived
 * validation flags so the UI can reflect readiness and progress.
 */
import { useState, useCallback, useMemo } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import type { MLClass } from '../types/ml';
import { ML } from '../constants';
import type { ErrorCategory } from '../types/errors';

/**
 * Manages training state, input validation, and the KNN training procedure.
 *
 * @param classes - The list of ML classes, each carrying its captured images and feature vectors.
 * @param classifier - The current KNN classifier instance, or null if none exists yet.
 * @param setClassifier - Callback to replace the active classifier after a successful training run.
 * @param setHasTrainedModel - Callback invoked with `true` once training completes successfully.
 * @param onError - Callback for reporting validation or training errors by category.
 * @returns An object with the training state flag, the train function, and derived validation flags.
 */
export function useModelTraining(
  classes: MLClass[],
  classifier: knnClassifier.KNNClassifier | null,
  setClassifier: (c: knnClassifier.KNNClassifier) => void,
  setHasTrainedModel: (v: boolean) => void,
  onError: (category: Extract<ErrorCategory, 'training' | 'validation'>, msg: string) => void
) {
  const [isTraining, setIsTraining] = useState(false);

  /** True when at least one class has an empty or whitespace-only name. */
  const hasInvalidNames = useMemo(
    () => classes.some(c => c.name.trim() === ''),
    [classes]
  );

  /** True when two or more classes share the same trimmed name. */
  const hasDuplicateNames = useMemo(
    () => new Set(classes.map(c => c.name.trim())).size !== classes.length,
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
    if (classes.length < ML.MIN_CLASSES) {
      onError('validation', `Du brauchst mindestens ${ML.MIN_CLASSES} Klassen, um ein Modell zu trainieren.`);
      return;
    }
    const classesWithFewImages = classes.filter(c => c.images.length < ML.MIN_IMAGES_PER_CLASS);
    if (classesWithFewImages.length > 0) {
      const names = classesWithFewImages
        .map(c => `"${c.name || 'Ohne Namen'}" (${c.images.length} Bilder)`)
        .join(', ');
      onError('validation', `Zu wenig Bilder: ${names}. Jede Klasse braucht mindestens ${ML.MIN_IMAGES_PER_CLASS} Bilder.`);
      return;
    }

    if (hasInvalidNames) {
      onError('validation', 'Bitte gib allen Klassen einen Namen.');
      return;
    }

    if (hasDuplicateNames) {
      onError('validation', 'Bitte gib allen Klassen einen eindeutigen Namen.');
      return;
    }

    setIsTraining(true);

    if (classifier) {
      classifier.dispose();
    }

    const newClassifier = knnClassifier.create();
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      for (const cls of classes) {
        for (const img of cls.images) {
          const tensor = tf.tensor1d(img.featureArray);
          newClassifier.addExample(tensor, cls.id);
          tensor.dispose();
        }
      }

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

  return { isTraining, trainModel, canTrain, hasInvalidNames, hasDuplicateNames };
}
