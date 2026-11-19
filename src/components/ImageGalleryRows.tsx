import {
  memo,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  type RefObject,
} from 'react';
import NextImage from 'next/image';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import type { Range, VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import Button from './Button';
import { CheckCircle2 } from './icons/check-circle2';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
import type { MLImage } from '../types/ml';

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
        <Badge
          variant="outline"
          aria-hidden="true"
          className={cn(
            'absolute top-1 right-1 size-4 p-0',
            isSelected
              ? 'text-primary-foreground bg-[var(--btn-color)] border-[var(--btn-color)]'
              : 'bg-background/80 border-input',
          )}
        >
          {isSelected && <CheckCircle2 data-icon aria-hidden="true" />}
        </Badge>
      )}
    </Button>
  );
});

/** Read the centralized Tailwind breakpoint rule used by the rendered gallery. */
function useColumnCount(ref: RefObject<HTMLDivElement | null>): number {
  const [cols, setCols] = useState(4);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
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
  }, [ref]);
  return cols;
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
            className="pb-1.5"
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

export interface ImageGalleryRowsProps extends Pick<
  GalleryRowsProps,
  'images' | 'selectedIds' | 'isSelectionMode' | 'onToggleSelect' | 'onImageClick'
> {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

/** Virtualization starts when the first collected image is ready for display. */
export default function ImageGalleryRows({ scrollContainerRef, ...props }: ImageGalleryRowsProps) {
  const columnCount = useColumnCount(scrollContainerRef);
  const focus = useGalleryFocus(props.images, columnCount);
  const virtualizer = useVirtualizer({
    count: Math.ceil(props.images.length / columnCount),
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 88,
    overscan: 3,
    rangeExtractor: focus.rangeExtractor,
  });
  useFocusedRowVisibility(columnCount, focus.focusedRow, virtualizer);
  return (
    <div
      className="relative grid w-full gap-x-2"
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
      }}
      onFocusCapture={focus.onFocusCapture}
      onBlurCapture={focus.onBlurCapture}
    >
      <GalleryRows
        {...props}
        columnCount={columnCount}
        virtualRows={virtualizer.getVirtualItems()}
      />
    </div>
  );
}
