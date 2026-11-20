import { RotateCcw } from './icons/rotate-ccw';
import { Trash2 } from './icons/trash2';
import type { MLClass } from '../types/ml';
import type { ModalState } from '../hooks/useModalState';
import ConfirmDialog from './modals/ConfirmDialog';
import ImagePreviewModal from './modals/ImagePreviewModal';

interface TrainingPageModalsProps {
  modal: ModalState;
  classes: MLClass[];
  closeModal: () => void;
  removeImage: (classId: string, imageId: string) => void;
  clearClass: (classId: string) => void;
  removeClass: (classId: string) => void;
}

type ConfirmationKind = Exclude<ModalState['type'], 'none' | 'imagePreview'>;

function confirmation(kind: ConfirmationKind, className: string | undefined) {
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

/** Each portal mounts on demand and retains its own content through exit. */
export default function TrainingPageModals({
  modal,
  classes,
  closeModal,
  removeImage,
  clearClass,
  removeClass,
}: TrainingPageModalsProps) {
  const preview = modal.type === 'imagePreview' ? modal : null;
  const confirm = modal.type !== 'none' && modal.type !== 'imagePreview' ? modal : null;
  const className = confirm ? classes.find(({ id }) => id === confirm.classId)?.name : '';

  return (
    <>
      <ImagePreviewModal
        isOpen={preview !== null}
        image={preview?.image ?? null}
        onClose={closeModal}
        onDelete={() => {
          if (!preview) return;
          removeImage(preview.classId, preview.image.id);
          closeModal();
        }}
      />
      <ConfirmDialog
        {...confirmation(confirm?.type ?? 'clearClass', className)}
        isOpen={confirm !== null}
        onClose={closeModal}
        onConfirm={() => {
          if (confirm?.type === 'clearClass') clearClass(confirm.classId);
          if (confirm?.type === 'removeClass') removeClass(confirm.classId);
          closeModal();
        }}
      />
    </>
  );
}
