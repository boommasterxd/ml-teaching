/**
 * useModalState.ts
 *
 * Manages all modal states for TrainingPage via a single discriminated union,
 * replacing multiple individual useState calls with one typed state atom.
 */
import { useCallback, useState } from 'react';
import type { MLImage } from '../types/ml';

/**
 * Discriminated union representing every possible modal the TrainingPage can show.
 *
 * - `none` — no modal is open
 * - `imagePreview` — preview of a single training image belonging to a class
 * - `clearConfirm` — confirmation dialog before clearing all training data
 * - `clearClass` — confirmation dialog before clearing images of one class
 * - `removeClass` — confirmation dialog before removing an entire class
 */
export type ModalState =
  | { type: 'none' }
  | { type: 'imagePreview'; classId: string; image: MLImage }
  | { type: 'clearConfirm' }
  | { type: 'clearClass'; classId: string }
  | { type: 'removeClass'; classId: string };

/**
 * Consolidates all modal states in TrainingPage into a single discriminated
 * union and exposes typed opener functions for each modal variant.
 *
 * @returns An object containing the current `modal` state and the following
 *   action functions:
 *   - `closeModal` — resets modal state to `none`
 *   - `showImagePreview` — opens the image-preview modal for a given class and image
 *   - `showClearConfirm` — opens the global clear-all confirmation modal
 *   - `showClearClass` — opens the clear-class confirmation modal for a given class
 *   - `showRemoveClass` — opens the remove-class confirmation modal for a given class
 */
export function useModalState() {
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const closeModal = useCallback(() => setModal({ type: 'none' }), []);

  /**
   * Opens the image-preview modal for a specific training image.
   *
   * @param classId - ID of the class the image belongs to.
   * @param image - The `MLImage` object to preview.
   */
  const showImagePreview = useCallback(
    (classId: string, image: MLImage) => setModal({ type: 'imagePreview', classId, image }),
    [],
  );

  /** Opens the confirmation modal for clearing all training data. */
  const showClearConfirm = useCallback(() => setModal({ type: 'clearConfirm' }), []);

  /**
   * Opens the confirmation modal for clearing all images of one class.
   *
   * @param classId - ID of the class whose images should be cleared.
   */
  const showClearClass = useCallback(
    (classId: string) => setModal({ type: 'clearClass', classId }),
    [],
  );

  /**
   * Opens the confirmation modal for removing an entire class.
   *
   * @param classId - ID of the class to remove.
   */
  const showRemoveClass = useCallback(
    (classId: string) => setModal({ type: 'removeClass', classId }),
    [],
  );

  return { modal, closeModal, showImagePreview, showClearConfirm, showClearClass, showRemoveClass };
}
