/**
 * useClassManagement.test.ts
 *
 * Unit tests for the useClassManagement hook, covering class CRUD operations,
 * image management, and invalidation callback behaviour.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFormState } from 'react-hook-form';
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

    it('verwendet die erste freie Standardnummer', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));

      act(() => result.current.addClass());

      expect(result.current.classes[2].name).toBe('Klasse 3');
    });

    it('ruft onInvalidate auf', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));

      act(() => result.current.addClass());

      expect(onInvalidate).toHaveBeenCalledTimes(1);
    });

    it('verwendet eine freigewordene Standardnummer nach dem Umbenennen erneut', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));

      act(() => result.current.updateClassName(result.current.classes[1].id, 'Hund'));
      act(() => result.current.addClass());

      expect(result.current.classes[2].name).toBe('Klasse 2');
    });

    it('vermeidet Namenskollisionen bei großen Nummern und Leerraum', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));
      const [first, second] = result.current.classes;

      act(() => {
        result.current.updateClassName(first.id, 'Klasse 10000000000000000');
        result.current.updateClassName(second.id, ' Klasse 2 ');
        result.current.addClass();
        result.current.addClass();
      });

      expect(result.current.classes.map(({ name }) => name)).toEqual([
        'Klasse 10000000000000000',
        ' Klasse 2 ',
        'Klasse 1',
        'Klasse 3',
      ]);
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
    it('reports both conflicting fields and clears the surviving field after removal', async () => {
      const { result } = renderHook(() => {
        const management = useClassManagement(onInvalidate);
        const { errors } = useFormState({ control: management.nameControl, name: 'names' });
        return { management, errors };
      });
      const [first, second] = result.current.management.classes;
      await act(async () => {
        result.current.management.addImage(second.id, mockImage('kept'));
        result.current.management.updateClassName(second.id, ` ${first.name} `);
      });
      await waitFor(() => {
        expect(result.current.errors.names?.[0]?.name?.message).toBe('Name muss eindeutig sein');
        expect(result.current.errors.names?.[1]?.name?.message).toBe('Name muss eindeutig sein');
      });

      await act(async () => result.current.management.removeClass(first.id));
      await waitFor(() => expect(result.current.errors.names).toBeUndefined());
      expect(result.current.management.classes[0]).toMatchObject({
        id: second.id,
        name: ` ${first.name} `,
        images: [{ id: 'kept' }],
      });
    });
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
    it('fügt ein Bild hinzu und behält die andere Klasse und Namensfelder bei', () => {
      const { result } = renderHook(() => useClassManagement(onInvalidate));
      const {
        classes: [first, second],
        names,
      } = result.current;
      const img = mockImage('img-1');

      act(() => result.current.addImage(first.id, img));

      expect(result.current.classes[0].images).toHaveLength(1);
      expect(result.current.classes[0].images[0]).toEqual(img);
      expect(result.current.classes[1]).toBe(second);
      expect(result.current.names).toBe(names);
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
});
