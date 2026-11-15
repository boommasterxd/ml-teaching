/**
 * useClassManagement.test.ts
 *
 * Unit tests for the useClassManagement hook, covering class CRUD operations,
 * image management, and invalidation callback behaviour.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClassManagement } from '@/hooks/useClassManagement';
import { ML } from '@/constants';
import type { MLImage } from '@/types/ml';

/**
 * Creates a minimal MLImage fixture with the given ID.
 *
 * @param id - Unique identifier used for both the image ID and base64 payload.
 * @returns A stub MLImage object suitable for use in tests.
 */
const mockImage = (id: string): MLImage => ({
  id,
  dataUrl: `data:image/png;base64,${id}`,
  featureArray: [0.1],
});

describe('useClassManagement', () => {
  let onInvalidate: Mock<() => void>;

  beforeEach(() => {
    onInvalidate = vi.fn<() => void>();
  });

  describe('Initialer Zustand', () => {
    it('startet mit zwei Klassen ("Klasse 1", "Klasse 2")', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));
      expect(result.current.classes).toHaveLength(2);
      expect(result.current.classes[0].name).toBe('Klasse 1');
      expect(result.current.classes[1].name).toBe('Klasse 2');
    });

    it('startet mit leeren Bilderlisten', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));
      expect(result.current.classes[0].images).toEqual([]);
      expect(result.current.classes[1].images).toEqual([]);
    });
  });

  describe('addClass', () => {
    it('fügt eine neue Klasse hinzu', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));

      act(() => result.current.addClass());

      expect(result.current.classes).toHaveLength(3);
    });

    it('benennt die neue Klasse auto-inkrementiert', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));

      act(() => result.current.addClass());

      expect(result.current.classes[2].name).toBe('Klasse 3');
    });

    it('ruft onInvalidate auf', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));

      act(() => result.current.addClass());

      expect(onInvalidate).toHaveBeenCalledTimes(1);
    });

    it('setzt die Nummer korrekt fort nach umbenennen', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));

      // Rename "Klasse 2" — auto-increment is based on the highest existing "Klasse N" number.
      act(() => result.current.updateClassName(result.current.classes[1].id, 'Hund'));
      act(() => result.current.addClass());

      // Highest remaining "Klasse N" number is 1, so the next one should be 2.
      expect(result.current.classes[2].name).toBe('Klasse 2');
    });
  });

  describe('removeClass', () => {
    it('entfernt die Klasse mit der angegebenen ID', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));
      const idToRemove = result.current.classes[0].id;

      act(() => result.current.removeClass(idToRemove));

      expect(result.current.classes).toHaveLength(1);
      expect(result.current.classes.find((c) => c.id === idToRemove)).toBeUndefined();
    });

    it('ruft onInvalidate auf', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));

      act(() => result.current.removeClass(result.current.classes[0].id));

      expect(onInvalidate).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateClassName', () => {
    it('benennt die Klasse um', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));
      const id = result.current.classes[0].id;

      act(() => result.current.updateClassName(id, 'Katze'));

      expect(result.current.classes[0].name).toBe('Katze');
    });

    it('schneidet Namen auf MAX_CLASS_NAME_LENGTH ab', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));
      const id = result.current.classes[0].id;
      const langerName = 'a'.repeat(ML.MAX_CLASS_NAME_LENGTH + 10);

      act(() => result.current.updateClassName(id, langerName));

      expect(result.current.classes[0].name).toHaveLength(ML.MAX_CLASS_NAME_LENGTH);
    });

    it('ruft onInvalidate NICHT auf', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));
      const id = result.current.classes[0].id;

      act(() => result.current.updateClassName(id, 'Neuer Name'));

      expect(onInvalidate).not.toHaveBeenCalled();
    });
  });

  describe('addImage / removeImage', () => {
    it('fügt ein Bild zur Klasse hinzu', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));
      const classId = result.current.classes[0].id;
      const img = mockImage('img-1');

      act(() => result.current.addImage(classId, img));

      expect(result.current.classes[0].images).toHaveLength(1);
      expect(result.current.classes[0].images[0]).toEqual(img);
    });

    it('addImage ruft onInvalidate NICHT auf', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));

      act(() => result.current.addImage(result.current.classes[0].id, mockImage('img-1')));

      expect(onInvalidate).not.toHaveBeenCalled();
    });

    it('entfernt ein einzelnes Bild', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));
      const classId = result.current.classes[0].id;
      const img = mockImage('img-1');

      act(() => result.current.addImage(classId, img));
      act(() => result.current.removeImage(classId, 'img-1'));

      expect(result.current.classes[0].images).toHaveLength(0);
    });

    it('removeImage ruft onInvalidate auf', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));
      const classId = result.current.classes[0].id;

      act(() => result.current.addImage(classId, mockImage('img-1')));
      onInvalidate.mockClear();
      act(() => result.current.removeImage(classId, 'img-1'));

      expect(onInvalidate).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeImages (Batch)', () => {
    it('entfernt mehrere Bilder auf einmal', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));
      const classId = result.current.classes[0].id;

      act(() => {
        result.current.addImage(classId, mockImage('img-1'));
        result.current.addImage(classId, mockImage('img-2'));
        result.current.addImage(classId, mockImage('img-3'));
      });
      act(() => result.current.removeImages(classId, ['img-1', 'img-3']));

      const images = result.current.classes[0].images;
      expect(images).toHaveLength(1);
      expect(images[0].id).toBe('img-2');
    });
  });

  describe('clearClass', () => {
    it('entfernt alle Bilder aus der Klasse, behält die Klasse', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));
      const classId = result.current.classes[0].id;

      act(() => {
        result.current.addImage(classId, mockImage('img-1'));
        result.current.addImage(classId, mockImage('img-2'));
      });
      act(() => result.current.clearClass(classId));

      expect(result.current.classes).toHaveLength(2);
      expect(result.current.classes[0].images).toHaveLength(0);
    });

    it('ruft onInvalidate auf', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));
      const classId = result.current.classes[0].id;

      act(() => result.current.addImage(classId, mockImage('img-1')));
      onInvalidate.mockClear();
      act(() => result.current.clearClass(classId));

      expect(onInvalidate).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetClasses', () => {
    it('setzt auf die zwei Default-Klassen zurück', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));

      act(() => result.current.addClass());
      act(() => result.current.addClass());
      expect(result.current.classes).toHaveLength(4);

      act(() => result.current.resetClasses());

      expect(result.current.classes).toHaveLength(2);
      expect(result.current.classes[0].name).toBe('Klasse 1');
      expect(result.current.classes[1].name).toBe('Klasse 2');
    });

    it('ruft onInvalidate NICHT auf', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));

      act(() => result.current.resetClasses());

      expect(onInvalidate).not.toHaveBeenCalled();
    });
  });
});
