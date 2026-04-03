/**
 * TrainingPageModals.tsx
 *
 * Encapsulates all modal dialogs controlled by useModalState in TrainingPage:
 * image preview, clear-all confirmation, clear-class confirmation, and
 * remove-class confirmation. Consent and loading modals remain in TrainingPage
 * as they are tied to the consent flow, not to modal state.
 */
import { useCallback } from 'react';
import { AlertCircle, RotateCcw, Trash2 } from 'lucide-react';
import type { MLClass, MLImage } from '../types/ml';
import type { ModalState } from '../hooks/useModalState';
import type { Classifier } from '../types/ml-models';
import { ConfirmDialog, ImagePreviewModal } from './modals';

/**
 * Props for TrainingPageModals.
 */
interface TrainingPageModalsProps {
  modal: ModalState;
  classes: MLClass[];
  classifier: Classifier | null;
  closeModal: () => void;
  removeImage: (classId: string, imageId: string) => void;
  clearClass: (classId: string) => void;
  removeClass: (classId: string) => void;
  resetClasses: () => void;
  setHasTrainedModel: (v: boolean) => void;
  stopPredicting: () => void;
}

/**
 * Renders all modal dialogs driven by the useModalState discriminated union.
 * Manages the handler callbacks internally so TrainingPage does not need to
 * declare them at the top level.
 */
export default function TrainingPageModals({
  modal,
  classes,
  classifier,
  closeModal,
  removeImage,
  clearClass,
  removeClass,
  resetClasses,
  setHasTrainedModel,
  stopPredicting,
}: TrainingPageModalsProps) {

  /** Resets all classes, the trained model, and prediction state. */
  const clearAll = useCallback(() => {
    resetClasses();
    setHasTrainedModel(false);
    stopPredicting();
    if (classifier) classifier.clearAllClasses();
    closeModal();
  }, [classifier, stopPredicting, resetClasses, closeModal, setHasTrainedModel]);

  /** Removes a single image and closes the preview modal. */
  const handleRemoveImage = useCallback((classId: string, imageId: string) => {
    removeImage(classId, imageId);
    closeModal();
  }, [removeImage, closeModal]);

  /** Clears all images from a class. */
  const handleClearClass = useCallback((id: string) => {
    clearClass(id);
    if (modal.type === 'imagePreview' && modal.classId === id) {
      closeModal();
    }
  }, [clearClass, modal, closeModal]);

  /** Confirms clearing all images from the class referenced in the modal. */
  const handleClearClassConfirm = useCallback(() => {
    if (modal.type === 'clearClass') {
      handleClearClass(modal.classId);
      closeModal();
    }
  }, [modal, handleClearClass, closeModal]);

  /** Confirms removing the class referenced in the modal. */
  const handleRemoveClassConfirm = useCallback(() => {
    if (modal.type === 'removeClass') {
      removeClass(modal.classId);
      closeModal();
    }
  }, [modal, removeClass, closeModal]);

  return (
    <>
      <ImagePreviewModal
        isOpen={modal.type === 'imagePreview'}
        onClose={closeModal}
        image={modal.type === 'imagePreview' ? modal.image : null}
        onDelete={() => modal.type === 'imagePreview' && handleRemoveImage(modal.classId, modal.image.id)}
      />

      <ConfirmDialog
        isOpen={modal.type === 'clearConfirm'}
        onClose={closeModal}
        onConfirm={clearAll}
        titleId="clear-modal-title"
        descId="clear-modal-desc"
        title="Daten unwiderruflich löschen?"
        description="Möchten Sie wirklich alle erfassten Klassen und Bilddaten löschen? Das aktuell trainierte Modell wird dabei unwiderruflich entfernt und der Vorgang kann nicht rückgängig gemacht werden."
        confirmLabel="Unwiderruflich löschen"
        icon={<AlertCircle className="w-6 h-6" />}
      />

      <ConfirmDialog
        isOpen={modal.type === 'clearClass'}
        onClose={closeModal}
        onConfirm={handleClearClassConfirm}
        titleId="class-clear-modal-title"
        descId="class-clear-modal-description"
        title="Bilder dieser Klasse löschen?"
        description={
          <>Möchten Sie wirklich alle Bilder der Klasse{' '}
            <strong>"{modal.type === 'clearClass' ? classes.find(c => c.id === modal.classId)?.name : ''}"</strong>{' '}
            unwiderruflich löschen?</>
        }
        confirmLabel="Zurücksetzen"
        icon={<RotateCcw className="w-6 h-6" />}
      />

      <ConfirmDialog
        isOpen={modal.type === 'removeClass'}
        onClose={closeModal}
        onConfirm={handleRemoveClassConfirm}
        titleId="class-remove-modal-title"
        descId="class-remove-modal-description"
        title="Klasse löschen?"
        description={
          <>Möchten Sie die Klasse{' '}
            <strong>"{modal.type === 'removeClass' ? classes.find(c => c.id === modal.classId)?.name : ''}"</strong>{' '}
            und alle zugehörigen Bilder wirklich entfernen?</>
        }
        confirmLabel="Löschen"
        icon={<Trash2 className="w-6 h-6" />}
      />
    </>
  );
}
