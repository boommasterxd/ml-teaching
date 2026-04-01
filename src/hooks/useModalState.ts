/**
 * Hook that consolidates all modal states in TrainingPage into a single
 * discriminated union, replacing 4 separate useState calls.
 */
import { useCallback, useState } from 'react';
import type { MLImage } from '../types/ml';

export type ModalState =
  | { type: 'none' }
  | { type: 'imagePreview'; classId: string; image: MLImage }
  | { type: 'clearConfirm' }
  | { type: 'clearClass'; classId: string }
  | { type: 'removeClass'; classId: string };

/** Provides a single modal state with typed open/close actions. */
export function useModalState() {
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const closeModal = useCallback(() => setModal({ type: 'none' }), []);

  const showImagePreview = useCallback((classId: string, image: MLImage) =>
    setModal({ type: 'imagePreview', classId, image }), []);

  const showClearConfirm = useCallback(() =>
    setModal({ type: 'clearConfirm' }), []);

  const showClearClass = useCallback((classId: string) =>
    setModal({ type: 'clearClass', classId }), []);

  const showRemoveClass = useCallback((classId: string) =>
    setModal({ type: 'removeClass', classId }), []);

  return { modal, closeModal, showImagePreview, showClearConfirm, showClearClass, showRemoveClass };
}
