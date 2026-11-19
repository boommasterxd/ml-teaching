import { useState } from 'react';
import { AlertCircle } from './icons/alert-circle';
import { RotateCcw } from './icons/rotate-ccw';
import { Trash2 } from './icons/trash2';
import type { MLClass } from '../types/ml';
import type { ModalState } from '../hooks/useModalState';
import type { Classifier } from '../types/ml-models';
import ConfirmDialog from './modals/ConfirmDialog';
import ImagePreviewModal from './modals/ImagePreviewModal';

interface TrainingPageModalsProps {
  modal: ModalState;
  classes: MLClass[];
  classifier: Classifier | null;
  closeModal: () => void;
  removeImage: (classId: string, imageId: string) => void;
  clearClass: (classId: string) => void;
  removeClass: (classId: string) => void;
  resetClasses: () => void;
  setHasTrainedModel: (value: boolean) => void;
  stopPredicting: () => void;
}

type ModalKind = ModalState['type'];
type ConfirmationKind = Exclude<ModalKind, 'none' | 'imagePreview'>;

function confirmation(kind: ConfirmationKind, className: string | undefined) {
  if (kind === 'clearConfirm')
    return {
      titleId: 'clear-modal-title',
      descId: 'clear-modal-desc',
      title: 'Daten unwiderruflich löschen?',
      description:
        'Möchten Sie wirklich alle erfassten Klassen und Bilddaten löschen? Das aktuell trainierte Modell wird dabei unwiderruflich entfernt und der Vorgang kann nicht rückgängig gemacht werden.',
      confirmLabel: 'Unwiderruflich löschen',
      icon: <AlertCircle />,
    };
  if (kind === 'clearClass')
    return {
      titleId: 'class-clear-modal-title',
      descId: 'class-clear-modal-description',
      title: 'Bilder dieser Klasse löschen?',
      description: (
        <>
          Möchten Sie wirklich alle Bilder der Klasse <strong>„{className}“</strong> unwiderruflich
          löschen?
        </>
      ),
      confirmLabel: 'Zurücksetzen',
      icon: <RotateCcw />,
    };
  return {
    titleId: 'class-remove-modal-title',
    descId: 'class-remove-modal-description',
    title: 'Klasse löschen?',
    description: (
      <>
        Möchten Sie die Klasse <strong>„{className}“</strong> und alle zugehörigen Bilder wirklich
        entfernen?
      </>
    ),
    confirmLabel: 'Löschen',
    icon: <Trash2 />,
  };
}

/** Mount the active dialog only, retaining its type for immediate focus restoration after close. */
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
  const [lastKind, setLastKind] = useState<ModalKind>('none');
  const isOpen = modal.type !== 'none';
  if (isOpen && lastKind !== modal.type) setLastKind(modal.type);
  const kind = isOpen ? modal.type : lastKind;
  if (kind === 'none') return null;
  if (kind === 'imagePreview')
    return (
      <ImagePreviewModal
        isOpen={isOpen}
        image={modal.type === 'imagePreview' ? modal.image : null}
        onClose={closeModal}
        onDelete={() => {
          if (modal.type !== 'imagePreview') return;
          removeImage(modal.classId, modal.image.id);
          closeModal();
        }}
      />
    );

  const className = 'classId' in modal ? classes.find(({ id }) => id === modal.classId)?.name : '';
  return (
    <ConfirmDialog
      {...confirmation(kind, className)}
      isOpen={isOpen}
      onClose={closeModal}
      onConfirm={() => {
        if (modal.type === 'clearClass') clearClass(modal.classId);
        if (modal.type === 'removeClass') removeClass(modal.classId);
        if (modal.type === 'clearConfirm') {
          resetClasses();
          setHasTrainedModel(false);
          stopPredicting();
          classifier?.clearAllClasses();
        }
        closeModal();
      }}
    />
  );
}
