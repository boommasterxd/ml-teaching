import { memo, useState, useEffect, useRef, useCallback, useMemo, type RefObject } from 'react';
import { useInView } from 'motion/react';
import { createRetryableLoader } from '@/lib/create-retryable-loader';
import Button from './Button';
import TrainingGalleryFrame from './TrainingGalleryFrame';
import { Trash2 } from './icons/trash2';
import { X } from './icons/x';
import { Alert, AlertDescription } from './ui/alert';
import type { MLImage } from '../types/ml';
import type { ImageGalleryRowsProps } from './ImageGalleryRows';

/**
 * Props for the ImageGallery component.
 */
interface ImageGalleryProps {
  className?: string;
  /** Distinguishes this class's gallery in landmark navigation. */
  label: string;
  /** The list of training images to display. */
  images: MLImage[];
  /** Accent color used for selection highlights and action buttons. */
  color: string;
  /** Called when the user clicks an image thumbnail outside of selection mode. */
  onImageClick: (img: MLImage) => void;
  pendingImageId?: string;
  /** Called with the IDs of images to remove after a bulk-delete action. */
  onRemoveImages: (ids: string[]) => void;
}

type GalleryRowsComponent = typeof import('./ImageGalleryRows').default;

const loadGalleryRows = createRetryableLoader(
  async () => (await import('./ImageGalleryRows')).default,
);

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
    <div className="grid justify-items-start gap-2">
      <Alert variant="destructive" className="p-2">
        <AlertDescription>Die Galerie konnte nicht geladen werden.</AlertDescription>
      </Alert>
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
  modeButtonRef: RefObject<HTMLButtonElement | null>;
  onToggleMode: () => void;
}

function GalleryToolbar({
  isSelectionMode,
  selectedCount,
  onDelete,
  modeButtonRef,
  onToggleMode,
}: GalleryToolbarProps) {
  return (
    <div className="flex min-h-9 shrink-0 items-center justify-between gap-1">
      <div className="text-sm font-medium text-foreground">
        {!isSelectionMode && <span>Bildergalerie</span>}
        <span role="status" aria-atomic="true">
          {isSelectionMode ? `${selectedCount} ausgewählt` : ''}
        </span>
      </div>
      <div className="flex gap-1">
        <Button
          ref={modeButtonRef}
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.currentTarget.focus({ preventScroll: true });
            onToggleMode();
          }}
          aria-label={isSelectionMode ? 'Auswahl abbrechen' : 'Mehrere markieren'}
        >
          {isSelectionMode ? (
            <>
              <X aria-hidden="true" />
              <span className="hidden @md/gallery:inline">Abbrechen</span>
            </>
          ) : (
            'Markieren'
          )}
        </Button>
        {isSelectionMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={selectedCount === 0}
            aria-label={
              selectedCount === 1
                ? '1 ausgewähltes Bild löschen'
                : `${selectedCount} ausgewählte Bilder löschen`
            }
          >
            <Trash2 aria-hidden="true" />
            <span className="hidden @md/gallery:inline">Löschen</span>
          </Button>
        )}
      </div>
    </div>
  );
}

const ImageGallery = memo(function ImageGallery({
  className,
  label,
  images,
  color,
  onImageClick,
  pendingImageId,
  onRemoveImages,
}: ImageGalleryProps) {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [rawSelectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const imageIds = useMemo(() => new Set(images.map(({ id }) => id)), [images]);
  const selectedIds = useMemo(
    () => new Set([...rawSelectedIds].filter((id) => imageIds.has(id))),
    [rawSelectedIds, imageIds],
  );
  if (images.length === 0 && isSelectionMode) {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  }
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const modeButtonRef = useRef<HTMLButtonElement>(null);
  const [focusWithin, setFocusWithin] = useState(false);
  // Prepare one gallery-height ahead of normal scrolling.
  const nearViewport = useInView(scrollContainerRef, { margin: '240px 0px' });
  const showRows = nearViewport || focusWithin;
  const hasImages = images.length > 0;

  /** Enters selection mode and adds or removes the image ID. */
  const toggleImageSelection = useCallback((id: string) => {
    setIsSelectionMode(true);
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
    const nextFocus = selectedIds.size === images.length ? scrollContainerRef : modeButtonRef;
    nextFocus.current?.focus({ preventScroll: true });
    onRemoveImages(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  return (
    <TrainingGalleryFrame
      className={className}
      label={label}
      color={color}
      scrollContainerRef={scrollContainerRef}
      scrollFade={showRows}
      onFocusWithinChange={setFocusWithin}
      toolbar={
        hasImages && (
          <GalleryToolbar
            isSelectionMode={isSelectionMode}
            selectedCount={selectedIds.size}
            onDelete={handleBulkDelete}
            modeButtonRef={modeButtonRef}
            onToggleMode={() => {
              if (isSelectionMode) setSelectedIds(new Set());
              setIsSelectionMode(!isSelectionMode);
            }}
          />
        )
      }
    >
      {hasImages && (
        <DeferredGalleryRows
          images={images}
          selectedIds={selectedIds}
          isSelectionMode={isSelectionMode}
          onToggleSelect={toggleImageSelection}
          onImageClick={onImageClick}
          pendingImageId={pendingImageId}
          scrollContainerRef={scrollContainerRef}
          showRows={showRows}
        />
      )}
    </TrainingGalleryFrame>
  );
});

export default ImageGallery;
