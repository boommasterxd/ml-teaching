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
type ImagePreview = Extract<ModalState, { type: 'imagePreview' }>;

function imagePreviewTitle(classes: MLClass[], preview: ImagePreview | null) {
  if (!preview) return 'Bildvorschau';
  const classIndex = classes.findIndex(({ id }) => id === preview.classId);
  const imageIndex = classes[classIndex]?.images.findIndex(({ id }) => id === preview.image.id);
  return imageIndex !== undefined && imageIndex >= 0
    ? `Bild ${imageIndex + 1} aus Klasse ${classIndex + 1}`
    : 'Bildvorschau';
}

function findPreviewReturnTarget(preview: ImagePreview | null) {
  if (!preview) return null;
  const gallery = document.querySelector<HTMLElement>(
    `[data-training-class-id="${CSS.escape(preview.classId)}"] .gallery-region`,
  );
  return (
    gallery?.querySelector<HTMLButtonElement>(
      `[data-image-id="${CSS.escape(preview.image.id)}"] button`,
    ) ??
    gallery ??
    null
  );
}

function confirmation(kind: ConfirmationKind, className: string | undefined) {
  if (kind === 'clearClass')
    return {
      titleId: 'class-clear-modal-title',
      descId: 'class-clear-modal-description',
      title: 'Bilder dieser Klasse löschen?',
      description: (
        <>
          Alle Bilder in <strong>„{className}“</strong> werden gelöscht. Die Klasse bleibt.
        </>
      ),
      confirmLabel: 'Alle Bilder löschen',
      icon: <RotateCcw />,
    };
  return {
    titleId: 'class-remove-modal-title',
    descId: 'class-remove-modal-description',
    title: 'Klasse löschen?',
    description: (
      <>
        Die Klasse <strong>„{className}“</strong> und ihre Bilder werden gelöscht.
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
        title={imagePreviewTitle(classes, preview)}
        image={preview?.image ?? null}
        resolveReturnFocus={() => findPreviewReturnTarget(preview)}
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
