/**
 * useClassManagement.ts
 *
 * Hook for managing the list of ML classification classes and their training images.
 * Provides CRUD operations for classes and exposes model invalidation on destructive changes.
 */
import { useState, useCallback } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trainingClassNamesSchema, type TrainingClassNames } from '@/lib/training-class-names';
import type { MLClass, MLImage } from '../types/ml';
import { COLORS } from '../types/ml';
import { ML } from '../constants';

/** A collection with N names always leaves a free default number among the first N + 1. */
function getNextClassNumber(classes: TrainingClassNames['names']): number {
  const names = new Set(classes.map(({ name }) => name.trim()));
  for (let number = 1; number <= classes.length; number += 1) {
    if (!names.has(`Klasse ${number}`)) return number;
  }
  return classes.length + 1;
}

type ClassExamples = Omit<MLClass, 'name'>;

const initialNames: TrainingClassNames = {
  names: [
    { classId: 'class-1', name: 'Klasse 1' },
    { classId: 'class-2', name: 'Klasse 2' },
  ],
};

function createInitialExamples(): ClassExamples[] {
  return initialNames.names.map(({ classId }, index) => ({
    id: classId,
    images: [],
    color: COLORS[index],
  }));
}

function appendClassImages(
  classes: ClassExamples[],
  classId: string,
  images: readonly MLImage[],
  expectedVersion?: number,
): ClassExamples[] {
  if (!images.length) return classes;
  return classes.map((cls) => {
    if (cls.id !== classId || cls.images.length >= ML.MAX_IMAGES_PER_CLASS) return cls;
    if (expectedVersion !== undefined && (cls.captureVersion ?? 0) !== expectedVersion) return cls;
    const capacity = ML.MAX_IMAGES_PER_CLASS - cls.images.length;
    return { ...cls, images: [...cls.images, ...images.slice(0, capacity)] };
  });
}

function useClassNames(onWarning?: (message: string) => void) {
  const { control, getValues, setValue, trigger } = useForm<TrainingClassNames>({
    defaultValues: initialNames,
    resolver: zodResolver(trainingClassNamesSchema, undefined, { mode: 'sync' }),
  });
  const { append, remove } = useFieldArray({ control, name: 'names' });
  const names = useWatch({ control, name: 'names' });

  const addName = useCallback(() => {
    const current = getValues('names');
    if (current.length >= ML.MAX_CLASSES) {
      onWarning?.(`Maximale Klassenanzahl von ${ML.MAX_CLASSES} erreicht.`);
      return;
    }
    const nextNum = getNextClassNumber(current);
    const id = `class-${crypto.randomUUID()}`;
    append({ classId: id, name: `Klasse ${nextNum}` }, { shouldFocus: false });
    void trigger('names');
    return { id, images: [], color: COLORS[(nextNum - 1) % COLORS.length] };
  }, [append, getValues, onWarning, trigger]);

  const removeName = useCallback(
    (id: string) => {
      const index = getValues('names').findIndex(({ classId }) => classId === id);
      if (index === -1) return false;
      remove(index);
      void trigger('names');
      return true;
    },
    [getValues, remove, trigger],
  );

  /** Renames a class. Does not invalidate the model. */
  const updateClassName = useCallback(
    (id: string, newName: string) => {
      const index = getValues('names').findIndex(({ classId }) => classId === id);
      if (index === -1) return;
      setValue(`names.${index}.name`, newName.slice(0, ML.MAX_CLASS_NAME_LENGTH), {
        shouldDirty: true,
      });
      void trigger('names');
    },
    [getValues, setValue, trigger],
  );

  return { names, nameControl: control, addName, removeName, updateClassName };
}

function useNamedClasses(examples: ClassExamples[], names: TrainingClassNames['names']) {
  const [snapshot, setSnapshot] = useState<{
    examples: ClassExamples[];
    names: TrainingClassNames['names'];
    classes: MLClass[];
  }>();
  if (snapshot?.examples === examples && snapshot.names === names) return snapshot.classes;

  const namesById = new Map(names.map(({ classId, name }) => [classId, name]));
  const previousClasses = new Map(
    snapshot?.examples.map((entry, index) => [entry, snapshot.classes[index]]),
  );
  const classes = examples.map((entry) => {
    const name = namesById.get(entry.id) ?? '';
    const previous = previousClasses.get(entry);
    return previous?.name === name ? previous : { ...entry, name };
  });
  setSnapshot({ examples, names, classes });
  return classes;
}

/** Owns example data and keeps class IDs consistent with the name fields. */
export function useClassManagement(
  onInvalidate: () => void,
  onWarning?: (message: string) => void,
) {
  const [examples, setExamples] = useState(createInitialExamples);
  const { names, nameControl, addName, removeName, updateClassName } = useClassNames(onWarning);
  const classes = useNamedClasses(examples, names);

  const addClass = useCallback(() => {
    const entry = addName();
    if (!entry) return;
    setExamples((prev) => [...prev, entry]);
    onInvalidate();
  }, [addName, onInvalidate]);

  const removeClass = useCallback(
    (id: string) => {
      if (!removeName(id)) return;
      setExamples((prev) => prev.filter((c) => c.id !== id));
      onInvalidate();
    },
    [onInvalidate, removeName],
  );

  const addImages = useCallback(
    (classId: string, images: readonly MLImage[], expectedCaptureVersion?: number) =>
      setExamples((prev) => appendClassImages(prev, classId, images, expectedCaptureVersion)),
    [],
  );

  /** Adds a single training image to a class, up to MAX_IMAGES_PER_CLASS. */
  const addImage = useCallback(
    (classId: string, newImage: MLImage, expectedCaptureVersion?: number) => {
      addImages(classId, [newImage], expectedCaptureVersion);
    },
    [addImages],
  );

  /** Removes a single image from a class and invalidates the model. */
  const removeImage = useCallback(
    (classId: string, imageId: string) => {
      setExamples((prev) =>
        prev.map((c) =>
          c.id === classId ? { ...c, images: c.images.filter((img) => img.id !== imageId) } : c,
        ),
      );
      onInvalidate();
    },
    [onInvalidate],
  );

  /** Removes multiple images from a class in one batch. */
  const removeImages = useCallback(
    (classId: string, imageIds: string[]) => {
      const idsToRemove = new Set(imageIds);
      setExamples((prev) =>
        prev.map((c) =>
          c.id === classId
            ? { ...c, images: c.images.filter((img) => !idsToRemove.has(img.id)) }
            : c,
        ),
      );
      onInvalidate();
    },
    [onInvalidate],
  );

  /** Removes all images from a class while keeping the class itself. */
  const clearClass = useCallback(
    (id: string) => {
      setExamples((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, images: [], captureVersion: (c.captureVersion ?? 0) + 1 } : c,
        ),
      );
      onInvalidate();
    },
    [onInvalidate],
  );

  return {
    classes,
    names,
    nameControl,
    addClass,
    removeClass,
    updateClassName,
    addImage,
    addImages,
    removeImage,
    removeImages,
    clearClass,
  };
}
