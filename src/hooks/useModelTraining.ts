/**
 * Hook that validates training prerequisites and trains the KNN classifier
 * from the collected image feature vectors.
 */
import { useState, useCallback, useMemo } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import type { MLClass } from '../types/ml';
import { ML } from '../constants';

/** Manages training state, validation checks, and the KNN training procedure. */
export function useModelTraining(
  classes: MLClass[],
  classifier: knnClassifier.KNNClassifier | null,
  setClassifier: (c: knnClassifier.KNNClassifier) => void,
  setHasTrainedModel: (v: boolean) => void,
  onError: (msg: string) => void
) {
  const [isTraining, setIsTraining] = useState(false);

  const hasInvalidNames = useMemo(
    () => classes.some(c => c.name.trim() === ''),
    [classes]
  );

  const hasDuplicateNames = useMemo(
    () => new Set(classes.map(c => c.name.trim())).size !== classes.length,
    [classes]
  );

  const canTrain = useMemo(
    () =>
      classes.length >= ML.MIN_CLASSES &&
      classes.every(c => c.images.length >= ML.MIN_IMAGES_PER_CLASS) &&
      !hasInvalidNames &&
      !hasDuplicateNames,
    [classes, hasInvalidNames, hasDuplicateNames]
  );

  /** Validates all prerequisites and trains a new KNN classifier from collected features. */
  const trainModel = useCallback(async () => {
    if (classes.length < ML.MIN_CLASSES) {
      onError(`Du brauchst mindestens ${ML.MIN_CLASSES} Klassen, um ein Modell zu trainieren.`);
      return;
    }
    const classesWithFewImages = classes.filter(c => c.images.length < ML.MIN_IMAGES_PER_CLASS);
    if (classesWithFewImages.length > 0) {
      const names = classesWithFewImages
        .map(c => `"${c.name || 'Ohne Namen'}" (${c.images.length} Bilder)`)
        .join(', ');
      onError(`Zu wenig Bilder: ${names}. Jede Klasse braucht mindestens ${ML.MIN_IMAGES_PER_CLASS} Bilder.`);
      return;
    }

    if (hasInvalidNames) {
      onError('Bitte gib allen Klassen einen Namen.');
      return;
    }

    if (hasDuplicateNames) {
      onError('Bitte gib allen Klassen einen eindeutigen Namen.');
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
      onError('Fehler beim Training des Modells.');
      setIsTraining(false);
    }
  }, [classes, classifier, setClassifier, setHasTrainedModel, onError, hasInvalidNames, hasDuplicateNames]);

  return { isTraining, trainModel, canTrain, hasInvalidNames, hasDuplicateNames };
}
