/**
 * ImagePreviewModal.tsx
 *
 * Modal that displays an enlarged preview of a single training image
 * and provides a delete action for that image.
 */
import { Trash2 } from '../icons/trash2';
import { X } from '../icons/x';
import Image from 'next/image';
import Dialog from '../Dialog';
import ModalContent from '../ModalContent';
import Button from '../Button';
import { DialogBody, DialogDescription, DialogFooter, DialogTitle } from '../ui/dialog';
import { Separator } from '../ui/separator';
import type { MLImage } from '../../types/ml';

/**
 * Props for the ImagePreviewModal component.
 */
interface ImagePreviewModalProps {
  /** Whether the modal is currently visible. */
  isOpen: boolean;
  /** Identifies the image by its position and class. */
  title: string;
  /** Callback invoked when the modal is closed via the close button. */
  onClose: () => void;
  /** The training image to preview, or null when no image is selected. */
  image: MLImage | null;
  /** Callback invoked when the user confirms deletion of the previewed image. */
  onDelete: () => void;
}

/**
 * Renders a modal with an enlarged view of a training image and a delete button.
 * The image content is only rendered when `image` is non-null.
 *
 * @param isOpen - Controls modal visibility.
 * @param title - Identifies the image by its position and class.
 * @param onClose - Called when the close button is clicked.
 * @param image - The MLImage to display, or null if none is selected.
 * @param onDelete - Called when the delete button is clicked.
 */
export default function ImagePreviewModal({
  isOpen,
  title,
  onClose,
  image,
  onDelete,
}: ImagePreviewModalProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="image-modal-title"
      describedBy="image-modal-desc"
    >
      <ModalContent maxWidth="sm">
        <div className="flex justify-between items-center">
          <DialogTitle id="image-modal-title" render={<h3 />}>
            {title}
          </DialogTitle>
          <DialogDescription id="image-modal-desc" className="sr-only">
            Vergrößerte Ansicht eines Trainingsbildes mit Option zum Löschen.
          </DialogDescription>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Schließen">
            <X data-icon="inline-start" aria-hidden="true" />
          </Button>
        </div>
        <Separator className="shrink-0" />
        {image && (
          <>
            <DialogBody tabIndex={0} role="region" aria-labelledby="image-modal-title">
              <Image
                src={image.dataUrl}
                width={192}
                height={192}
                unoptimized
                alt="Vergrößerte Bildvorschau"
                className="mx-auto size-48 rounded-xl border border-input object-cover"
              />
            </DialogBody>
            <DialogFooter className="sm:grid-cols-1">
              <Button variant="destructive" onClick={onDelete}>
                <Trash2 data-icon="inline-start" aria-hidden="true" /> Bild löschen
              </Button>
            </DialogFooter>
          </>
        )}
      </ModalContent>
    </Dialog>
  );
}
