import { memo, useState, useEffect, useRef, useCallback } from 'react';
import Button from './Button';
import { Image as ImageIcon } from './icons/image';
import { Trash2 } from './icons/trash2';
import { X } from './icons/x';
import { cn } from '../lib/utils';
import { classColorClasses } from '../lib/class-colors';
import { Empty, EmptyDescription, EmptyMedia } from './ui/empty';
import { ML } from '../constants';
import type { MLImage } from '../types/ml';
import type { ImageGalleryRowsProps } from './ImageGalleryRows';

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

type GalleryRowsComponent = typeof import('./ImageGalleryRows').default;

let pendingRows: Promise<GalleryRowsComponent> | undefined;

function loadGalleryRows() {
  pendingRows ??= import('./ImageGalleryRows')
    .then(({ default: Rows }) => Rows)
    .catch((error: unknown) => {
      pendingRows = undefined;
      throw error;
    });
  return pendingRows;
}

/** Warm the same local chunk from file selection and capture controls. */
export function prepareImageGallery() {
  void loadGalleryRows().catch(() => {});
}

function DeferredGalleryRows(props: ImageGalleryRowsProps) {
  const [Rows, setRows] = useState<GalleryRowsComponent>();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (Rows) return;
    // Wait until the scroll host is committed before mounting the virtualizer.
    let active = true;
    void loadGalleryRows().then(
      (loaded) => {
        if (active) setRows(() => loaded);
      },
      () => {
        if (active) setFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [attempt, Rows]);
  if (Rows) return <Rows {...props} />;
  if (!failed)
    return (
      <p role="status" className="p-2 text-sm">
        Galerie wird geladen.
      </p>
    );
  return (
    <div className="grid justify-items-start gap-2 p-2 text-sm">
      <p role="status">Die Galerie konnte nicht geladen werden.</p>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          props.scrollContainerRef.current?.focus();
          setFailed(false);
          setAttempt((previous) => previous + 1);
        }}
      >
        Erneut versuchen
      </Button>
    </div>
  );
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
  onDelete: () => void;
  onCancel: () => void;
  onSelect: () => void;
}

function GalleryToolbar({
  isSelectionMode,
  selectedCount,
  onDelete,
  onCancel,
  onSelect,
}: GalleryToolbarProps) {
  return (
    <div className="flex min-h-9 shrink-0 items-center justify-between gap-1">
      <span className="text-sm font-medium text-foreground">
        {isSelectionMode ? `${selectedCount} ausgewählt` : 'Bildergalerie'}
      </span>
      <div className="flex gap-1">
        {isSelectionMode ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={selectedCount === 0}
              aria-label={`${selectedCount} ausgewählte Bilder löschen`}
            >
              <Trash2 aria-hidden="true" />
              <span className="hidden @md/gallery:inline">Löschen</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel} aria-label="Auswahl abbrechen">
              <X aria-hidden="true" />
              <span className="hidden @md/gallery:inline">Abbrechen</span>
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={onSelect} aria-label="Mehrere markieren">
            Markieren
          </Button>
        )}
      </div>
    </div>
  );
}

function GalleryEmpty() {
  return (
    <Empty className="h-full gap-3 p-2 md:p-2">
      <EmptyMedia variant="icon" className="gallery-empty-symbol" aria-hidden="true">
        <ImageIcon className="size-5" />
      </EmptyMedia>
      <EmptyDescription className="max-w-[34ch]">
        Sammle mindestens {ML.MIN_IMAGES_PER_CLASS} Bilder desselben Motivs aus verschiedenen
        Blickwinkeln.
      </EmptyDescription>
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

  return (
    <div className={cn('@container/gallery min-w-0', classColorClasses(color))}>
      <div className="flex h-36 min-w-0 flex-col @sm/gallery:h-44">
        {hasImages && (
          <GalleryToolbar
            isSelectionMode={isSelectionMode}
            selectedCount={selectedIds.size}
            onDelete={handleBulkDelete}
            onCancel={() => {
              setIsSelectionMode(false);
              setSelectedIds(new Set());
            }}
            onSelect={() => setIsSelectionMode(true)}
          />
        )}
        <div
          ref={scrollContainerRef}
          tabIndex={hasImages ? 0 : -1}
          role="region"
          aria-label={label}
          className="gallery-region min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto rounded-2xl bg-muted/60 p-1.5 dark:bg-background/40"
        >
          {hasImages ? (
            <DeferredGalleryRows
              images={images}
              selectedIds={selectedIds}
              isSelectionMode={isSelectionMode}
              onToggleSelect={toggleImageSelection}
              onImageClick={onImageClick}
              scrollContainerRef={scrollContainerRef}
            />
          ) : (
            <GalleryEmpty />
          )}
        </div>
      </div>
    </div>
  );
});

export default ImageGallery;
