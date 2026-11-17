/**
 * ImageGallery.tsx
 *
 * Scrollable thumbnail gallery for collected ML training images. Supports a
 * selection mode that lets users mark and bulk-delete multiple images at once.
 */
import { memo, useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import NextImage from 'next/image';
import Button from './Button';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import type { Range, VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import { Image as ImageIcon } from './icons/image';
import { CheckCircle2 } from './icons/check-circle2';
import { cn } from '../lib/utils';
import { classColorClasses } from '../lib/class-colors';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from './ui/empty';
import type { MLImage } from '../types/ml';

/**
 * Props for the ImageGallery component.
 */
interface ImageGalleryProps {
  /** Distinguishes this class's gallery in landmark navigation. */
  label: string;
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
const ImageThumbnail = memo(function ImageThumbnail({
  img,
  imgIndex,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  onImageClick,
}: ImageThumbnailProps) {
  return (
    <Button
      variant="thumbnail"
      size="thumbnail"
      type="button"
      data-selection-mode={isSelectionMode || undefined}
      aria-pressed={isSelectionMode ? isSelected : undefined}
      aria-label={
        isSelectionMode ? (isSelected ? 'Bild abwählen' : 'Bild auswählen') : 'Bild vergrößern'
      }
      onClick={() => (isSelectionMode ? onToggleSelect(img.id) : onImageClick(img))}
    >
      <NextImage
        src={img.dataUrl}
        alt={`Trainingsbeispiel ${imgIndex + 1}`}
        width={224}
        height={224}
        unoptimized
        className="w-full h-full object-cover"
      />
      {isSelectionMode && (
        <div
          className={cn(
            'absolute top-1 right-1 size-4 rounded-full border flex items-center justify-center ',
            isSelected
              ? 'text-primary-foreground bg-[var(--btn-color)] border-[var(--btn-color)]'
              : 'bg-background/80 border-input',
          )}
        >
          {isSelected && <CheckCircle2 data-icon aria-hidden="true" />}
        </div>
      )}
    </Button>
  );
});

/** Read the centralized Tailwind breakpoint rule used by the rendered gallery. */
function useColumnCount(ref: React.RefObject<HTMLDivElement | null>, enabled: boolean): number {
  const [cols, setCols] = useState(4);
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    const update = () => {
      const value = Number.parseInt(
        getComputedStyle(element).getPropertyValue('--gallery-columns'),
        10,
      );
      if (Number.isInteger(value) && value >= 1 && value <= 6) setCols(value);
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => observer.disconnect();
  }, [ref, enabled]);
  return cols;
}

/**
 * Scrollable thumbnail grid for training images with selectable bulk-delete mode.
 *
 * In normal mode each thumbnail opens the image preview via `onImageClick`.
 * Activating selection mode lets the user mark individual thumbnails and delete
 * them all at once through `onRemoveImages`.
 */
interface GalleryToolbarProps {
  isSelectionMode: boolean;
  selectedCount: number;
  hasImages: boolean;
  onDelete: () => void;
  onCancel: () => void;
  onSelect: () => void;
}

function GalleryToolbar({
  isSelectionMode,
  selectedCount,
  hasImages,
  onDelete,
  onCancel,
  onSelect,
}: GalleryToolbarProps) {
  return (
    <div className="flex min-h-11 flex-wrap justify-between items-center gap-x-2 mb-2">
      <span className="eyebrow">
        {isSelectionMode ? `${selectedCount} ausgewählt` : 'Gesammelte Bilder'}
      </span>
      <div className="flex gap-2 min-h-[2rem]">
        {isSelectionMode ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={selectedCount === 0}
              aria-label={`${selectedCount} ausgewählte Bilder löschen`}
            >
              Löschen
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel} aria-label="Auswahl abbrechen">
              Abbrechen
            </Button>
          </>
        ) : (
          hasImages && (
            <Button variant="ghost" size="sm" onClick={onSelect} aria-label="Bilder auswählen">
              Auswählen
            </Button>
          )
        )}
      </div>
    </div>
  );
}

interface GalleryRowsProps extends Pick<
  ImageThumbnailProps,
  'isSelectionMode' | 'onToggleSelect' | 'onImageClick'
> {
  images: MLImage[];
  columnCount: number;
  virtualRows: VirtualItem[];
  selectedIds: Set<string>;
}

function GalleryRows({
  images,
  columnCount,
  virtualRows,
  selectedIds,
  isSelectionMode,
  onToggleSelect,
  onImageClick,
}: GalleryRowsProps) {
  return (
    <>
      {virtualRows.flatMap((virtualRow) => {
        const startIndex = virtualRow.index * columnCount;
        const rowImages = images.slice(startIndex, startIndex + columnCount);
        return rowImages.map((img, colIdx) => (
          <div
            key={img.id}
            data-image-id={img.id}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
              gridColumn: `${colIdx + 1} / ${colIdx + 2}`,
            }}
          >
            <ImageThumbnail
              img={img}
              imgIndex={startIndex + colIdx}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.has(img.id)}
              onToggleSelect={onToggleSelect}
              onImageClick={onImageClick}
            />
          </div>
        ));
      })}
    </>
  );
}

/** Keep the focused image mounted when responsive columns change its row. */
function useGalleryFocus(images: MLImage[], columnCount: number) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focusedIndex = images.findIndex((image) => image.id === focusedId);
  const focusedRow = focusedIndex < 0 ? -1 : Math.floor(focusedIndex / columnCount);
  const rangeExtractor = useCallback(
    (range: Range) => {
      const rows = defaultRangeExtractor(range);
      if (focusedRow < 0 || rows.includes(focusedRow)) return rows;
      return [...rows, focusedRow].sort((first, second) => first - second);
    },
    [focusedRow],
  );

  return {
    focusedRow,
    rangeExtractor,
    onFocusCapture: (event: React.FocusEvent<HTMLDivElement>) => {
      const image = (event.target as HTMLElement).closest<HTMLElement>('[data-image-id]');
      setFocusedId(image?.dataset.imageId ?? null);
    },
    onBlurCapture: (event: React.FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFocusedId(null);
    },
  };
}

function useFocusedRowVisibility(
  columnCount: number,
  focusedRow: number,
  virtualizer: Virtualizer<HTMLDivElement, Element>,
) {
  const previousColumns = useRef(columnCount);
  useLayoutEffect(() => {
    if (previousColumns.current !== columnCount && focusedRow >= 0) {
      virtualizer.scrollToIndex(focusedRow, { align: 'auto' });
    }
    previousColumns.current = columnCount;
  }, [columnCount, focusedRow, virtualizer]);
}

function GalleryEmpty() {
  return (
    <Empty className="h-full p-3 md:p-3">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ImageIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyDescription>Halte „Aufnehmen“ gedrückt, um Bilder zu sammeln.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

const ImageGallery = memo(function ImageGallery({
  label,
  images,
  color,
  onImageClick,
  onRemoveImages,
}: ImageGalleryProps) {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [rawSelectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectedIds = new Set(
    [...rawSelectedIds].filter((id) => images.some((image) => image.id === id)),
  );
  if (images.length === 0 && isSelectionMode) {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  }
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasImages = images.length > 0;
  const columnCount = useColumnCount(scrollContainerRef, hasImages);
  const focus = useGalleryFocus(images, columnCount);

  /** Adds or removes an image ID from the current selection set. */
  const toggleImageSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /** Deletes all currently selected images and exits selection mode. */
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    onRemoveImages(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const rowCount = Math.ceil(images.length / columnCount);

  const virtualizer = useVirtualizer({
    enabled: hasImages,
    count: rowCount,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 88,
    overscan: 3,
    rangeExtractor: focus.rangeExtractor,
  });

  useFocusedRowVisibility(columnCount, focus.focusedRow, virtualizer);

  return (
    <div
      className={cn('relative h-[220px] sm:flex-1 min-w-0 flex flex-col', classColorClasses(color))}
    >
      <GalleryToolbar
        isSelectionMode={isSelectionMode}
        selectedCount={selectedIds.size}
        hasImages={images.length > 0}
        onDelete={handleBulkDelete}
        onCancel={() => {
          setIsSelectionMode(false);
          setSelectedIds(new Set());
        }}
        onSelect={() => setIsSelectionMode(true)}
      />
      <div
        ref={scrollContainerRef}
        tabIndex={0}
        role="region"
        aria-label={label}
        onFocusCapture={focus.onFocusCapture}
        onBlurCapture={focus.onBlurCapture}
        className="gallery-region flex-1 min-h-0 bg-muted/40 rounded-xl border border-border p-2 overflow-y-auto overflow-x-hidden"
      >
        {images.length > 0 ? (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
              columnGap: '0.5rem',
            }}
          >
            <GalleryRows
              images={images}
              columnCount={columnCount}
              virtualRows={virtualizer.getVirtualItems()}
              selectedIds={selectedIds}
              isSelectionMode={isSelectionMode}
              onToggleSelect={toggleImageSelection}
              onImageClick={onImageClick}
            />
          </div>
        ) : (
          <GalleryEmpty />
        )}
      </div>
    </div>
  );
});

export default ImageGallery;
