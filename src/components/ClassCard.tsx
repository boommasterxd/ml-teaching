/**
 * ClassCard.tsx
 *
 * Card component representing a single ML class.
 * Orchestrates camera recording, image upload, and thumbnail gallery via subcomponents.
 */
import type React from 'react';
import { memo, useCallback } from 'react';
import { Trash2, RotateCcw } from './icons';
import { cn } from '../lib/utils';
import { classColorClasses } from '../lib/class-colors';
import { useClassCapture } from '../hooks/useClassCapture';
import type { CaptureActions } from '../hooks/useClassCapture';
import { ML } from '../constants';
import type { MLClass, MLImage } from '../types/ml';
import CameraPreview from './CameraPreview';
import ImageGallery from './ImageGallery';
import Button from './Button';
import { Input } from './ui/input';
import { Card, CardAction, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Field, FieldError, FieldLabel } from './ui/field';
import { Separator } from './ui/separator';

/**
 * Callback actions for the ClassCard component, grouped to reduce prop count.
 */
export interface ClassCardActions extends CaptureActions {
  /** Called when a new training frame is captured from the video element. */
  onAddExample: (classId: string, video: HTMLVideoElement) => void;
  /** Called when a training image is added via file upload. */
  onAddImageExample: (classId: string, img: HTMLImageElement) => void | Promise<void>;
  /** Called to request removal of the entire class. */
  onRemove: (classId: string) => void;
  /** Called to clear all images from the class without removing it. */
  onClear: (classId: string) => void;
  /** Called to remove a specific subset of images by their IDs. */
  onRemoveImages: (classId: string, ids: string[]) => void;
  /** Called when the class name input changes. */
  onUpdateName: (classId: string, name: string) => void;
  /** Called when a thumbnail image in the gallery is clicked. */
  onImageClick: (classId: string, img: MLImage) => void;
  /** Called when a file cannot be read or decoded as an image. */
  onError: (message: string) => void;
}

/**
 * Props for the ClassCard component.
 */
interface ClassCardProps {
  position: number;
  /** The ML class data to display and manage. */
  cls: MLClass;
  /** Whether the class name conflicts with another class name. */
  isDuplicate: boolean;
  /** Active camera stream to render in the preview. `null` if no camera is available. */
  stream: MediaStream | null;
  /** Which camera to use: `'user'` for front-facing, `'environment'` for rear-facing. */
  facingMode: 'user' | 'environment';
  /** Grouped callback actions for class management and user interactions. */
  actions: ClassCardActions;
}

/**
 * Displays a class card with its editable name, camera preview, recording controls, and image gallery.
 * Uses `memo` to prevent unnecessary re-renders when sibling class cards update.
 */
function ClassHeader({
  cls,
  position,
  isDuplicate,
  actions,
}: Pick<ClassCardProps, 'cls' | 'position' | 'isDuplicate' | 'actions'>) {
  const { onClear, onRemove, onUpdateName } = actions;
  const isEmpty = cls.name.trim() === '';
  const errorMsg = isEmpty
    ? 'Name darf nicht leer sein'
    : isDuplicate
      ? 'Name muss eindeutig sein'
      : null;
  return (
    <CardHeader>
      <Field data-invalid={!!errorMsg} className="col-span-full min-w-0 gap-2 sm:col-span-1">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              'size-2.5 shrink-0 rounded-full bg-[var(--btn-color)]',
              classColorClasses(cls.color),
            )}
            aria-hidden="true"
          />
          <FieldLabel htmlFor={`class-name-${cls.id}`} className="sr-only">
            Name für Klasse {position}: {cls.name.trim() || 'ohne Namen'}
          </FieldLabel>
          <Input
            id={`class-name-${cls.id}`}
            type="text"
            autoComplete="off"
            value={cls.name}
            maxLength={ML.MAX_CLASS_NAME_LENGTH}
            onChange={(e) => onUpdateName(cls.id, e.target.value)}
            className="w-full"
            onPointerDown={(e) => {
              e.currentTarget.dataset.mouseFocused = '1';
            }}
            onBlur={(e) => {
              delete e.currentTarget.dataset.mouseFocused;
            }}
            aria-invalid={!!errorMsg}
            aria-errormessage={errorMsg ? `error-${cls.id}` : undefined}
            aria-describedby={errorMsg ? `error-${cls.id}` : undefined}
          />
        </div>
        {errorMsg && (
          <FieldError id={`error-${cls.id}`} className="ml-[22px]">
            {errorMsg}
          </FieldError>
        )}
      </Field>
      <CardAction className="col-span-full row-span-1 row-start-2 w-full sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:w-auto">
        <div className="flex min-w-0 items-center gap-2">
          <Badge
            variant={cls.images.length >= ML.MAX_IMAGES_PER_CLASS ? 'destructive' : 'secondary'}
            className="mr-auto sm:mr-0"
            title={
              cls.images.length >= ML.MAX_IMAGES_PER_CLASS
                ? `Limit von ${ML.MAX_IMAGES_PER_CLASS} Bildern erreicht`
                : undefined
            }
          >
            {cls.images.length} / {ML.MAX_IMAGES_PER_CLASS} Bilder
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onClear(cls.id)}
            title="Bilder dieser Klasse zurücksetzen"
            aria-label={`Bilder der Klasse ${position}: ${cls.name.trim() || 'ohne Namen'} zurücksetzen`}
          >
            <RotateCcw data-icon="inline-start" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(cls.id)}
            title="Klasse löschen"
            aria-label={`Klasse ${position}: ${cls.name.trim() || 'ohne Namen'} löschen`}
          >
            <Trash2 data-icon="inline-start" aria-hidden="true" />
          </Button>
        </div>
      </CardAction>
    </CardHeader>
  );
}

const ClassCard = memo(function ClassCard({
  cls,
  position,
  isDuplicate,
  stream,
  facingMode,
  actions,
}: ClassCardProps) {
  const { onRemoveImages, onImageClick } = actions;
  const { videoRef, isRecording, startRecording, stopRecording, handleFileUpload } =
    useClassCapture(cls, actions);

  /** Forwards an image click to the parent with the current class ID. */
  const handleImageClick = useCallback(
    (img: MLImage) => {
      onImageClick(cls.id, img);
    },
    [onImageClick, cls.id],
  );

  /** Forwards a bulk image removal request to the parent with the current class ID. */
  const handleRemoveImages = useCallback(
    (ids: string[]) => {
      onRemoveImages(cls.id, ids);
    },
    [onRemoveImages, cls.id],
  );

  return (
    <Card>
      <ClassHeader cls={cls} position={position} isDuplicate={isDuplicate} actions={actions} />
      <Separator />

      <CardContent className="flex flex-col gap-5 sm:flex-row">
        <CameraPreview
          disabled={actions.captureDisabled}
          stream={stream}
          facingMode={facingMode}
          isRecording={isRecording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onFileUpload={handleFileUpload}
          videoRef={videoRef}
        />

        <ImageGallery
          label={`Trainingsbilder von Klasse ${position}: ${cls.name.trim() || 'ohne Namen'}, scrollbar`}
          images={cls.images}
          color={cls.color}
          onImageClick={handleImageClick}
          onRemoveImages={handleRemoveImages}
        />
      </CardContent>
    </Card>
  );
});

export default ClassCard;
