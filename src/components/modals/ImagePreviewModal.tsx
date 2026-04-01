/**
 * ImagePreviewModal.tsx
 *
 * Modal that displays an enlarged preview of a single training image
 * and provides a delete action for that image.
 */
import { Trash2, X } from 'lucide-react';
import Dialog from '../Dialog';
import ModalContent from '../ModalContent';
import type { MLImage } from '../../types/ml';

/**
 * Props for the ImagePreviewModal component.
 */
interface ImagePreviewModalProps {
  /** Whether the modal is currently visible. */
  isOpen: boolean;
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
 * @param onClose - Called when the close button is clicked.
 * @param image - The MLImage to display, or null if none is selected.
 * @param onDelete - Called when the delete button is clicked.
 */
export default function ImagePreviewModal({ isOpen, onClose, image, onDelete }: ImagePreviewModalProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} labelledBy="image-modal-title">
      <ModalContent maxWidth="sm">
        <div className="p-4 border-b border-zinc-100 flex justify-between items-center">
          <h3 id="image-modal-title" className="font-bold text-zinc-800 text-sm">Bild Vorschau</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {image && (
          <div className="p-6 flex flex-col items-center">
            <img
              src={image.dataUrl}
              alt="Vergrößerte Bildvorschau"
              className="w-48 h-48 object-cover rounded-2xl shadow-sm border border-zinc-200 mb-6"
            />
            <button
              onClick={onDelete}
              className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" /> Bild löschen
            </button>
          </div>
        )}
      </ModalContent>
    </Dialog>
  );
}
