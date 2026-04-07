/**
 * ImageGallery.tsx
 *
 * Scrollable thumbnail gallery for collected ML training images. Supports a
 * selection mode that lets users mark and bulk-delete multiple images at once.
 */
import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import type { MLImage } from '../types/ml';

/**
 * Props for the ImageGallery component.
 */
export interface ImageGalleryProps {
  /** The list of training images to display. */
  images: MLImage[];
  /** Accent color used for selection highlights and action buttons. */
  color: string;
  /** Called when the user clicks an image thumbnail outside of selection mode. */
  onImageClick: (img: MLImage) => void;
  /** Called with the IDs of images to remove after a bulk-delete action. */
  onRemoveImages: (ids: string[]) => void;
}

/** Internal props for the ImageThumbnail component. */
interface ImageThumbnailProps {
  /** The training image to render. */
  img: MLImage;
  /** Zero-based position in the image list, used for the alt text. */
  imgIndex: number;
  /** Whether the gallery is currently in bulk-selection mode. */
  isSelectionMode: boolean;
  /** Whether this specific thumbnail is currently selected. */
  isSelected: boolean;
  /** Accent color applied to the selection indicator and border. */
  color: string;
  /** Called with the image ID when the user toggles its selection state. */
  onToggleSelect: (id: string) => void;
  /** Called with the full image object when clicked outside of selection mode. */
  onImageClick: (img: MLImage) => void;
}

/**
 * Renders a single training image thumbnail with an optional selection overlay.
 *
 * In selection mode the thumbnail shows a colored checkbox indicator and calls
 * `onToggleSelect` on click. Outside selection mode it calls `onImageClick`.
 *
 * @param props - See {@link ImageThumbnailProps}.
 */
const ImageThumbnail = memo(function ImageThumbnail({ img, imgIndex, isSelectionMode, isSelected, color, onToggleSelect, onImageClick }: ImageThumbnailProps) {
  return (
    <button
      type="button"
      aria-label={
        isSelectionMode
          ? isSelected ? 'Bild abwählen' : 'Bild auswählen'
          : 'Bild vergrößern'
      }
      className={cn(
        'aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all relative block w-full h-full p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500',
        isSelectionMode
          ? isSelected
            ? 'ring-2'
            : 'border-zinc-300 opacity-60 hover:opacity-100'
          : 'border-zinc-300 hover:shadow-sm'
      )}
      style={{
        borderColor: (isSelectionMode && isSelected) ? color : undefined,
        boxShadow: (isSelectionMode && isSelected) ? `0 0 0 2px ${color}33` : undefined,
      }}
      onClick={() => isSelectionMode ? onToggleSelect(img.id) : onImageClick(img)}
    >
      <img src={img.dataUrl} alt={`Trainingsbeispiel ${imgIndex + 1}`} className="w-full h-full object-cover" />
      {isSelectionMode && (
        <div
          className={cn(
            'absolute top-1 right-1 w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
            isSelected ? 'text-white' : 'bg-white/80 border-zinc-300'
          )}
          style={{
            backgroundColor: isSelected ? color : undefined,
            borderColor: isSelected ? color : undefined,
          }}
        >
          {isSelected && <CheckCircle2 className="w-3 h-3" aria-hidden="true" />}
        </div>
      )}
    </button>
  );
});

/**
 * Returns the number of grid columns matching the current viewport width,
 * mirroring the Tailwind responsive breakpoints used in the gallery grid.
 */
function useColumnCount(): number {
  const [cols, setCols] = useState(4);

  useEffect(() => {
    const queries = [
      { mql: window.matchMedia('(min-width: 1280px)'), cols: 6 }, // xl:grid-cols-6
      { mql: window.matchMedia('(min-width: 1024px)'), cols: 5 }, // lg:grid-cols-5
      { mql: window.matchMedia('(min-width: 768px)'), cols: 6 },  // md:grid-cols-6
      { mql: window.matchMedia('(min-width: 640px)'), cols: 5 },  // sm:grid-cols-5
    ];

    const update = () => {
      for (const { mql, cols } of queries) {
        if (mql.matches) { setCols(cols); return; }
      }
      setCols(4);
    };

    update();
    queries.forEach(({ mql }) => mql.addEventListener('change', update));
    return () => queries.forEach(({ mql }) => mql.removeEventListener('change', update));
  }, []);

  return cols;
}

/**
 * Scrollable thumbnail grid for training images with selectable bulk-delete mode.
 *
 * In normal mode each thumbnail opens the image preview via `onImageClick`.
 * Activating selection mode lets the user mark individual thumbnails and delete
 * them all at once through `onRemoveImages`.
 */
const ImageGallery = memo(function ImageGallery({
  images,
  color,
  onImageClick,
  onRemoveImages,
}: ImageGalleryProps) {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const columnCount = useColumnCount();

  /** Adds or removes an image ID from the current selection set. */
  const toggleImageSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * Keeps the selection state consistent whenever the image list changes.
   * Exits selection mode when all images are removed. Otherwise, drops any
   * selected IDs that no longer exist in the current image list.
   */
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

  const rowCount = Math.ceil(images.length / columnCount);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 88,
    overscan: 3,
  });

  return (
    <div className="relative h-[220px] sm:flex-1 min-w-0 flex flex-col">
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
          {isSelectionMode ? `${selectedIds.size} ausgewählt` : 'Gesammelte Bilder'}
        </span>
        <div className="flex gap-2 min-h-[2rem]">
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
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 bg-zinc-50/50 rounded-xl border border-zinc-300 p-2 overflow-y-auto overflow-x-hidden"
      >
        {images.length > 0 ? (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map(virtualRow => {
              const startIndex = virtualRow.index * columnCount;
              const rowImages = images.slice(startIndex, startIndex + columnCount);
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                    gap: '0.5rem',
                    alignContent: 'start',
                  }}
                >
                  {rowImages.map((img, colIdx) => (
                    <ImageThumbnail
                      key={img.id}
                      img={img}
                      imgIndex={startIndex + colIdx}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedIds.has(img.id)}
                      color={color}
                      onToggleSelect={toggleImageSelection}
                      onImageClick={onImageClick}
                    />
                  ))}
                </div>
              );
            })}
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
