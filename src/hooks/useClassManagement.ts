import { useState, useCallback } from 'react';
import type { MLClass, MLImage } from '../types/ml';
import { COLORS } from '../types/ml';

function createInitialClasses(): MLClass[] {
  return [
    { id: 'class-1', name: 'Klasse 1', images: [], color: COLORS[0] },
    { id: 'class-2', name: 'Klasse 2', images: [], color: COLORS[1] },
  ];
}

export function useClassManagement(onInvalidate: () => void) {
  const [classes, setClasses] = useState<MLClass[]>(createInitialClasses);

  const addClass = useCallback(() => {
    setClasses(prev => {
      let nextNum = 1;
      const existingNums = prev
        .map(c => {
          const match = c.name.match(/Klasse (\d+)/);
          return match ? parseInt(match[1], 10) : null;
        })
        .filter((n): n is number => n !== null);

      if (existingNums.length > 0) {
        nextNum = Math.max(...existingNums) + 1;
      } else if (prev.length > 0) {
        nextNum = prev.length + 1;
      }

      const newId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? `class-${crypto.randomUUID()}`
          : `class-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      return [...prev, {
        id: newId,
        name: `Klasse ${nextNum}`,
        images: [],
        color: COLORS[(nextNum - 1) % COLORS.length],
      }];
    });
    onInvalidate();
  }, [onInvalidate]);

  const removeClass = useCallback((id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    onInvalidate();
  }, [onInvalidate]);

  const updateClassName = useCallback((id: string, newName: string) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
  }, []);

  const addImage = useCallback((classId: string, newImage: MLImage) => {
    setClasses(prev => prev.map(c =>
      c.id === classId ? { ...c, images: [...c.images, newImage] } : c
    ));
  }, []);

  const removeImage = useCallback((classId: string, imageId: string) => {
    setClasses(prev => prev.map(c =>
      c.id === classId ? { ...c, images: c.images.filter(img => img.id !== imageId) } : c
    ));
    onInvalidate();
  }, [onInvalidate]);

  const removeImages = useCallback((classId: string, imageIds: string[]) => {
    const idsToRemove = new Set(imageIds);
    setClasses(prev => prev.map(c =>
      c.id === classId ? { ...c, images: c.images.filter(img => !idsToRemove.has(img.id)) } : c
    ));
    onInvalidate();
  }, [onInvalidate]);

  const clearClass = useCallback((id: string) => {
    setClasses(prev => prev.map(c =>
      c.id === id ? { ...c, images: [] } : c
    ));
    onInvalidate();
  }, [onInvalidate]);

  const resetClasses = useCallback(() => {
    setClasses(createInitialClasses());
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
