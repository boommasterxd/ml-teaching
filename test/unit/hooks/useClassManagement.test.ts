/**
 * useClassManagement.test.ts
 *
 * Unit tests for the useClassManagement hook, covering class CRUD operations,
 * image management, and invalidation callback behaviour.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useClassManagement, useTrainingClassName } from '@/hooks/useClassManagement';
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

function useEditableClasses(onInvalidate: () => void) {
  const management = useClassManagement(onInvalidate);
  const { nameControl, validateNames } = management;
  const first = useTrainingClassName(nameControl, 0, validateNames);
  const second = useTrainingClassName(nameControl, 1, validateNames);
  return { ...management, editors: [first, second] };
}

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
      const { result } = renderHook(() => useEditableClasses(onInvalidate));

      act(() => result.current.editors[1].edit('Hund'));
      act(() => result.current.addClass());

      expect(result.current.classes[2].name).toBe('Klasse 2');
    });

    it('vermeidet Namenskollisionen bei großen Nummern und Leerraum', () => {
      const { result } = renderHook(() => useEditableClasses(onInvalidate));
      const [first, second] = result.current.editors;

      act(() => {
        first.edit('Klasse 10000000000000000');
        second.edit(' Klasse 2 ');
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

  describe('class name fields', () => {
    it('keeps field errors and training validity aligned after rapid corrections', async () => {
      const { result } = renderHook(() => useEditableClasses(onInvalidate));
      const firstName = result.current.classes[0].name;

      await act(async () => {
        result.current.editors[1].edit(firstName);
        expect(result.current.readNameValidity().hasDuplicateNames).toBe(true);
        result.current.editors[1].edit(' ');
      });
      expect(result.current.nameValidity).toEqual({
        hasInvalidNames: true,
        hasDuplicateNames: false,
      });
      expect(result.current.editors[0].error).toBeUndefined();
      expect(result.current.editors[1].error).toBe('Name darf nicht leer sein');

      await act(async () => result.current.editors[1].edit('Hund'));
      expect(result.current.nameValidity.hasInvalidNames).toBe(false);
      expect(result.current.editors.map(({ error }) => error)).toEqual([undefined, undefined]);
    });

    it('reports both conflicting fields and clears the surviving field after removal', async () => {
      const { result } = renderHook(() => useEditableClasses(onInvalidate));
      const [first, second] = result.current.classes;
      await act(async () => {
        result.current.addImage(second.id, mockImage('kept'));
        result.current.editors[1].edit(` ${first.name} `);
      });
      await waitFor(() => {
        expect(result.current.editors[0].error).toBe('Name muss eindeutig sein');
        expect(result.current.editors[1].error).toBe('Name muss eindeutig sein');
      });

      await act(async () => result.current.removeClass(first.id));
      await waitFor(() => expect(result.current.editors[0].error).toBeUndefined());
      expect(result.current.editors[0].field.value).toBe(` ${first.name} `);
      expect(result.current.classes[0]).toMatchObject({
        id: second.id,
        name: ` ${first.name} `,
        images: [{ id: 'kept' }],
      });
    });
    it('benennt die Klasse um', () => {
      const { result } = renderHook(() => useEditableClasses(onInvalidate));

      act(() => result.current.editors[0].edit('Katze'));

      expect(result.current.classes[0].name).toBe('Katze');
    });

    it('schneidet Namen auf MAX_CLASS_NAME_LENGTH ab', () => {
      const { result } = renderHook(() => useEditableClasses(onInvalidate));
      const langerName = 'a'.repeat(ML.MAX_CLASS_NAME_LENGTH + 10);

      act(() => result.current.editors[0].edit(langerName));

      expect(result.current.classes[0].name).toHaveLength(ML.MAX_CLASS_NAME_LENGTH);
    });

    it('ruft onInvalidate NICHT auf', () => {
      const { result } = renderHook(() => useEditableClasses(onInvalidate));

      act(() => result.current.editors[0].edit('Neuer Name'));

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
