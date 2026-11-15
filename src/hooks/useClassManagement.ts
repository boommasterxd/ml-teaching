/**
 * useClassManagement.ts
 *
 * Hook for managing the list of ML classification classes and their training images.
 * Provides CRUD operations for classes and exposes model invalidation on destructive changes.
 */
import { useState, useCallback } from 'react';
import type { MLClass, MLImage } from '../types/ml';
import { COLORS } from '../types/ml';
import { ML } from '../constants';

/** Returns the next auto-incremented class number based on existing "Klasse N" names. */
function getNextClassNumber(classes: MLClass[]): number {
  const existingNums = classes
    .map((c) => c.name.match(/Klasse (\d+)/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => parseInt(m[1], 10));

  if (existingNums.length > 0) return Math.max(...existingNums) + 1;
  if (classes.length > 0) return classes.length + 1;
  return 1;
}

/** Returns the default set of two empty classes. */
function createInitialClasses(): MLClass[] {
  return [
    { id: 'class-1', name: 'Klasse 1', images: [], color: COLORS[0] },
    { id: 'class-2', name: 'Klasse 2', images: [], color: COLORS[1] },
  ];
}

function appendClassImage(
  classes: MLClass[],
  classId: string,
  image: MLImage,
  expectedVersion?: number,
): MLClass[] {
  return classes.map((cls) => {
    if (cls.id !== classId || cls.images.length >= ML.MAX_IMAGES_PER_CLASS) return cls;
    if (expectedVersion !== undefined && (cls.captureVersion ?? 0) !== expectedVersion) return cls;
    return { ...cls, images: [...cls.images, image] };
  });
}

/**
 * Provides CRUD operations for ML classes and their training images.
 *
 * @param onInvalidate - Callback invoked whenever a change renders the trained model stale
 *   (e.g. class or image removed). Renaming a class does NOT trigger this callback.
 * @param onWarning - Optional callback invoked when a user action is blocked by a limit
 *   (e.g. max classes or max images per class reached).
 * @returns An object with the current class list and all mutation functions.
 */
export function useClassManagement(
  onInvalidate: () => void,
  onWarning?: (message: string) => void,
) {
  const [classes, setClasses] = useState<MLClass[]>(createInitialClasses);

  /** Appends a new empty class with an auto-incremented name and color. */
  const addClass = useCallback(() => {
    if (classes.length >= ML.MAX_CLASSES) {
      onWarning?.(`Maximale Klassenanzahl von ${ML.MAX_CLASSES} erreicht.`);
      return;
    }
    setClasses((prev) => {
      if (prev.length >= ML.MAX_CLASSES) return prev;
      const nextNum = getNextClassNumber(prev);
      const newId = `class-${crypto.randomUUID()}`;
      return [
        ...prev,
        {
          id: newId,
          name: `Klasse ${nextNum}`,
          images: [],
          color: COLORS[(nextNum - 1) % COLORS.length],
        },
      ];
    });
    onInvalidate();
  }, [classes.length, onInvalidate, onWarning]);

  /** Removes a class by ID and invalidates the trained model. */
  const removeClass = useCallback(
    (id: string) => {
      setClasses((prev) => prev.filter((c) => c.id !== id));
      onInvalidate();
    },
    [onInvalidate],
  );

  /** Renames a class. Does not invalidate the model. */
  const updateClassName = useCallback((id: string, newName: string) => {
    setClasses((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, name: newName.slice(0, ML.MAX_CLASS_NAME_LENGTH) } : c,
      ),
    );
  }, []);

  /** Adds a single training image to a class, up to MAX_IMAGES_PER_CLASS. */
  const addImage = useCallback(
    (classId: string, newImage: MLImage, expectedCaptureVersion?: number) => {
      setClasses((prev) => appendClassImage(prev, classId, newImage, expectedCaptureVersion));
    },
    [],
  );

  /** Removes a single image from a class and invalidates the model. */
  const removeImage = useCallback(
    (classId: string, imageId: string) => {
      setClasses((prev) =>
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
      setClasses((prev) =>
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
      setClasses((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, images: [], captureVersion: (c.captureVersion ?? 0) + 1 } : c,
        ),
      );
      onInvalidate();
    },
    [onInvalidate],
  );

  /** Resets to the default two empty classes. */
  const resetClasses = useCallback(() => {
    setClasses(
      createInitialClasses().map((cls) => ({ ...cls, id: `class-${crypto.randomUUID()}` })),
    );
  }, []);

  return {
    classes,
    addClass,
    removeClass,
    updateClassName,
    addImage,
    removeImage,
    removeImages,
    clearClass,
    resetClasses,
  };
}
