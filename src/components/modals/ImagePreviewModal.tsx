/**
 * Modal that displays an enlarged preview of a training image with a delete option.
 */
import { Trash2, X } from 'lucide-react';
import Dialog from '../Dialog';
import ModalContent from '../ModalContent';
import type { MLImage } from '../../types/ml';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: MLImage | null;
  onDelete: () => void;
}

/** Shows a larger version of a training image and allows the user to delete it. */
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
