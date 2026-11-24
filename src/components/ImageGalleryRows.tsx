import {
  memo,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from 'react';
import NextImage from 'next/image';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import type { Range, VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import Button from './Button';
import { prepareTrainingDialogs } from './DeferredTrainingDialogs';
import { Check } from './icons/check';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
import { Spinner } from './ui/spinner';
import type { MLImage } from '../types/ml';

const thumbnailHoldDelayMs = 450;
const thumbnailHoldSlopPx = 10;

type ThumbnailPointerEvent = PointerEvent<HTMLButtonElement>;

function useThumbnailPress(onHold: () => void, onClick: () => void) {
  const hold = useRef<{ pointerId: number; x: number; y: number; timer: number } | null>(null);
  const suppressPointerClick = useRef(false);
  useEffect(() => () => window.clearTimeout(hold.current?.timer), []);

  const cancelHold = (event: ThumbnailPointerEvent) => {
    const press = hold.current;
    if (!press || press.pointerId !== event.pointerId) return;
    window.clearTimeout(press.timer);
    hold.current = null;
  };

  return {
    onPointerDown: (event: ThumbnailPointerEvent) => {
      if (!event.isPrimary || hold.current) return;
      suppressPointerClick.current = false;
      if (event.button !== 0) return;
      const { pointerId, clientX, clientY } = event;
      hold.current = {
        pointerId,
        x: clientX,
        y: clientY,
        timer: window.setTimeout(() => {
          if (document.hidden) return;
          suppressPointerClick.current = true;
          onHold();
        }, thumbnailHoldDelayMs),
      };
    },
    onPointerMove: (event: ThumbnailPointerEvent) => {
      const press = hold.current;
      if (!press || press.pointerId !== event.pointerId) return;
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) <= thumbnailHoldSlopPx)
        return;
      suppressPointerClick.current = true;
      cancelHold(event);
    },
    onPointerUp: cancelHold,
    onPointerCancel: cancelHold,
    onPointerLeave: cancelHold,
    onLostPointerCapture: cancelHold,
    onContextMenu: (event: MouseEvent<HTMLButtonElement>) => {
      if (hold.current || suppressPointerClick.current) event.preventDefault();
    },
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      if (event.detail > 0 && suppressPointerClick.current) {
        suppressPointerClick.current = false;
        return;
      }
      // Keep a keyboard-activated thumbnail in view when the dialog takes focus.
      if (event.detail === 0) event.currentTarget.scrollIntoView?.({ block: 'nearest' });
      onClick();
    },
  };
}

/** Internal props for the ImageThumbnail component. */
interface ImageThumbnailProps {
  /** The training image to render. */
  img: MLImage;
  /** Zero-based position in the class's image list. */
  imgIndex: number;
  /** Whether the gallery is currently in bulk-selection mode. */
  isSelectionMode: boolean;
  /** Whether this specific thumbnail is currently selected. */
  isSelected: boolean;
  pending: boolean;
  /** Enters selection mode and toggles the given image. */
  onToggleSelect: (id: string) => void;
  /** Called with the full image object when clicked outside of selection mode. */
  onImageClick: (img: MLImage) => void;
}

/**
 * Renders a single training image thumbnail with an optional selection overlay.
 *
 * Holding the thumbnail toggles its selection. A short click previews it
 * outside selection mode and toggles it inside selection mode.
 *
 * @param props - See {@link ImageThumbnailProps}.
 */
const ImageThumbnail = memo(function ImageThumbnail({
  img,
  imgIndex,
  isSelectionMode,
  isSelected,
  pending,
  onToggleSelect,
  onImageClick,
}: ImageThumbnailProps) {
  const imageNumber = imgIndex + 1;
  const press = useThumbnailPress(
    () => onToggleSelect(img.id),
    () => (isSelectionMode ? onToggleSelect(img.id) : onImageClick(img)),
  );
  return (
    <Button
      variant="thumbnail"
      size="thumbnail"
      type="button"
      data-selection-mode={isSelectionMode || undefined}
      aria-pressed={isSelectionMode ? isSelected : undefined}
      aria-haspopup={isSelectionMode ? undefined : 'dialog'}
      aria-busy={pending || undefined}
      aria-label={`Bild ${imageNumber} ${isSelectionMode ? 'auswählen' : 'vergrößern'}`}
      onPointerEnter={isSelectionMode ? undefined : prepareTrainingDialogs}
      onFocus={isSelectionMode ? undefined : prepareTrainingDialogs}
      {...press}
      onPointerDown={(event) => {
        if (!isSelectionMode) prepareTrainingDialogs();
        press.onPointerDown(event);
      }}
    >
      <NextImage
        src={img.dataUrl}
        alt={`Trainingsbeispiel ${imageNumber}`}
        width={224}
        height={224}
        unoptimized
        draggable={false}
        className="w-full h-full object-cover"
      />
      {pending && (
        <Badge
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-auto size-8 rounded-full bg-background p-0 text-foreground shadow-sm"
        >
          <Spinner />
        </Badge>
      )}
      {isSelectionMode && (
        <Badge
          variant="outline"
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute top-1 right-1 size-5 rounded-sm p-0',
            isSelected
              ? 'border-transparent bg-background text-primary'
              : 'bg-background/80 border-input',
          )}
        >
          {isSelected && <Check data-icon aria-hidden="true" />}
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
  pendingImageId?: string;
}

function GalleryRows({
  images,
  columnCount,
  virtualRows,
  selectedIds,
  isSelectionMode,
  onToggleSelect,
  onImageClick,
  pendingImageId,
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
              pending={!isSelectionMode && pendingImageId === img.id}
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
  | 'images'
  | 'selectedIds'
  | 'isSelectionMode'
  | 'onToggleSelect'
  | 'onImageClick'
  | 'pendingImageId'
> {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  showRows: boolean;
}

/** Virtualization starts when the first collected image is ready for display. */
export default function ImageGalleryRows({
  scrollContainerRef,
  showRows,
  ...props
}: ImageGalleryRowsProps) {
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
      {showRows && (
        <GalleryRows
          {...props}
          columnCount={columnCount}
          virtualRows={virtualizer.getVirtualItems()}
        />
      )}
    </div>
  );
}
