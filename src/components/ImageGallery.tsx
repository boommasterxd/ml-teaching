/**
 * Thumbnail gallery for collected training images with selection and bulk deletion.
 */
import { memo, useState, useEffect } from 'react';
import { Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import type { MLImage } from '../types/ml';

export interface ImageGalleryProps {
  images: MLImage[];
  color: string;
  onImageClick: (img: MLImage) => void;
  onRemoveImages: (ids: string[]) => void;
}

/** Scrollable thumbnail grid for training images with selectable bulk-delete mode. */
const ImageGallery = memo(function ImageGallery({
  images,
  color,
  onImageClick,
  onRemoveImages,
}: ImageGalleryProps) {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /** Adds or removes an image ID from the current selection set. */
  const toggleImageSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    if (images.length === 0) {
      setIsSelectionMode(false);
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(prev => {
      if (prev.size === 0) return prev;
      const existingIds = new Set(images.map(img => img.id));
      const filtered = new Set([...prev].filter(id => existingIds.has(id)));
      return filtered.size === prev.size ? prev : filtered;
    });
  }, [images]);

  /** Deletes all currently selected images and exits selection mode. */
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    onRemoveImages(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  return (
    <div className="flex-1 relative min-h-[160px] sm:min-h-0 flex flex-col">
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
          {isSelectionMode ? `${selectedIds.size} ausgewählt` : 'Gesammelte Bilder'}
        </span>
        <div className="flex gap-2">
          {isSelectionMode ? (
            <>
              <button
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0}
                aria-label={`${selectedIds.size} ausgewählte Bilder löschen`}
                className="text-[10px] font-bold py-1.5 px-3 min-h-[24px] min-w-[44px] transition-opacity hover:opacity-70 disabled:text-zinc-300 disabled:opacity-50"
                style={{ color: selectedIds.size > 0 ? color : undefined }}
              >
                Löschen
              </button>
              <button
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedIds(new Set());
                }}
                aria-label="Auswahl abbrechen"
                className="text-[10px] font-bold py-1.5 px-3 min-h-[24px] min-w-[44px] text-zinc-600 hover:text-zinc-700 transition-colors"
              >
                Abbrechen
              </button>
            </>
          ) : (
            images.length > 0 && (
              <button
                onClick={() => setIsSelectionMode(true)}
                aria-label="Bilder auswählen"
                className="text-[10px] font-bold py-1.5 px-3 min-h-[24px] min-w-[44px] transition-opacity hover:opacity-70"
                style={{ color }}
              >
                Auswählen
              </button>
            )
          )}
        </div>
      </div>
      <div className="flex-1 relative h-[190px] max-h-[190px] bg-zinc-50/50 rounded-xl border border-zinc-200 p-2 overflow-y-auto">
        {images.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {images.map((img, imgIndex) => (
              <button
                key={img.id}
                type="button"
                aria-label={
                  isSelectionMode
                    ? selectedIds.has(img.id) ? 'Bild abwählen' : 'Bild auswählen'
                    : 'Bild vergrößern'
                }
                className={cn(
                  'aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all relative block w-full h-full p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500',
                  isSelectionMode
                    ? selectedIds.has(img.id)
                      ? 'ring-2'
                      : 'border-zinc-200 opacity-60 hover:opacity-100'
                    : 'border-zinc-200 hover:shadow-sm'
                )}
                style={{
                  borderColor: (isSelectionMode && selectedIds.has(img.id)) ? color : undefined,
                  boxShadow: (isSelectionMode && selectedIds.has(img.id)) ? `0 0 0 2px ${color}33` : undefined,
                }}
                onClick={() => isSelectionMode ? toggleImageSelection(img.id) : onImageClick(img)}
              >
                <img src={img.dataUrl} alt={`Trainingsbeispiel ${imgIndex + 1}`} className="w-full h-full object-cover" />
                {isSelectionMode && (
                  <div
                    className={cn(
                      'absolute top-1 right-1 w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
                      selectedIds.has(img.id) ? 'text-white' : 'bg-white/80 border-zinc-300'
                    )}
                    style={{
                      backgroundColor: selectedIds.has(img.id) ? color : undefined,
                      borderColor: selectedIds.has(img.id) ? color : undefined,
                    }}
                  >
                    {selectedIds.has(img.id) && <CheckCircle2 className="w-3 h-3" aria-hidden="true" />}
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 text-zinc-600">
            <ImageIcon className="w-6 h-6 mb-2 opacity-20" aria-hidden="true" />
            <p className="text-xs">Halte "Aufnehmen" gedrückt, um Bilder zu sammeln.</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default ImageGallery;
