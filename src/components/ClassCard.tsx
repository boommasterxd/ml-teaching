/**
 * ClassCard.tsx
 *
 * Card component representing a single ML class.
 * Orchestrates camera recording, image upload, and thumbnail gallery via subcomponents.
 */
import type React from 'react';
import { memo, useCallback, useState } from 'react';
import { Trash2 } from './icons/trash2';
import { RotateCcw } from './icons/rotate-ccw';
import { Check } from './icons/check';
import { cn } from '../lib/utils';
import { classColorClasses } from '../lib/class-colors';
import { useClassCapture } from '../hooks/useClassCapture';
import type { CaptureActions } from '../hooks/useClassCapture';
import { ML } from '../constants';
import type { MLClass, MLImage } from '../types/ml';
import CameraPreview from './CameraPreview';
import type { CameraPreviewProps } from './CameraPreview';
import { prepareTrainingDialogs } from './DeferredTrainingDialogs';
import ImageGallery, { prepareImageGallery } from './ImageGallery';
import Button from './Button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Field, FieldError, FieldLabel } from './ui/field';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

const nameErrors = {
  empty: 'Name darf nicht leer sein',
  duplicate: 'Name muss eindeutig sein',
};

/**
 * Callback actions for the ClassCard component, grouped to reduce prop count.
 */
export interface ClassCardActions extends CaptureActions {
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
interface ClassCardProps extends Pick<
  CameraPreviewProps,
  'stream' | 'facingMode' | 'isCameraSwitching' | 'onSwitchCamera'
> {
  position: number;
  cameraFallback?: React.ReactNode;
  /** The ML class data to display and manage. */
  cls: MLClass;
  /** Whether the class name conflicts with another class name. */
  isDuplicate: boolean;
  /** Grouped callback actions for class management and user interactions. */
  actions: ClassCardActions;
}

function ClassNameInput({
  id,
  name,
  error,
  onChange,
}: {
  id: string;
  name: string;
  error: string | null;
  onChange: (name: string) => void;
}) {
  const [showError, setShowError] = useState(false);
  const errorId = `${id}-error`;
  return (
    <Tooltip
      open={!!error && showError}
      disabled={!error}
      onOpenChange={(open, { reason }) => {
        if (open || reason !== 'trigger-hover' || document.activeElement?.id !== id) {
          setShowError(open);
        }
      }}
    >
      <TooltipTrigger
        closeOnClick={false}
        aria-describedby={undefined}
        render={
          <div className="min-w-0 flex-1">
            <Input
              id={id}
              type="text"
              autoComplete="off"
              value={name}
              maxLength={ML.MAX_CLASS_NAME_LENGTH}
              onChange={(event) => {
                onChange(event.currentTarget.value);
                setShowError(true);
              }}
              onFocus={() => setShowError(true)}
              onPointerDown={(event) => {
                event.currentTarget.dataset.mouseFocused = '1';
                setShowError(true);
              }}
              onBlur={(event) => {
                delete event.currentTarget.dataset.mouseFocused;
                setShowError(false);
              }}
              className="h-10 min-w-0 rounded-xl bg-background/60 font-medium dark:bg-background/60"
              aria-invalid={!!error}
              aria-errormessage={error ? errorId : undefined}
              aria-describedby={error ? errorId : undefined}
            />
          </div>
        }
      />
      <TooltipContent collisionPadding={12} aria-hidden="true">
        {error}
      </TooltipContent>
      <FieldError
        id={errorId}
        role={error ? 'alert' : undefined}
        aria-live="polite"
        className="sr-only"
      >
        {error}
      </FieldError>
    </Tooltip>
  );
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
  const { onUpdateName } = actions;
  const count = cls.images.length;
  const enoughImages = count >= ML.MIN_IMAGES_PER_CLASS;
  const atLimit = count >= ML.MAX_IMAGES_PER_CLASS;
  const isEmpty = cls.name.trim() === '';
  const errorMsg = isEmpty ? nameErrors.empty : isDuplicate ? nameErrors.duplicate : null;
  return (
    <CardHeader className="items-center px-4 @md/training-class:px-5">
      <Field data-invalid={!!errorMsg} className="min-w-0 gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={cn(
              'size-2.5 shrink-0 rounded-full bg-[var(--class-on-surface)]',
              classColorClasses(cls.color),
            )}
            aria-hidden="true"
          />
          <FieldLabel htmlFor={`class-name-${cls.id}`} className="sr-only">
            Name für Klasse {position}: {cls.name.trim() || 'ohne Namen'}
          </FieldLabel>
          <ClassNameInput
            id={`class-name-${cls.id}`}
            name={cls.name}
            error={errorMsg}
            onChange={(name) => onUpdateName(cls.id, name)}
          />
          <Badge
            variant="secondary"
            className="min-h-7 max-w-[50%] px-2.5 whitespace-normal tabular-nums"
            title={`Mindestens ${ML.MIN_IMAGES_PER_CLASS}, maximal ${ML.MAX_IMAGES_PER_CLASS} Bilder pro Klasse`}
          >
            {enoughImages && <Check aria-hidden="true" />}
            <span>
              {enoughImages ? `${count} Bilder` : `${count} / ${ML.MIN_IMAGES_PER_CLASS} Bilder`}
              {atLimit && ' · Limit erreicht'}
            </span>
          </Badge>
        </div>
      </Field>
    </CardHeader>
  );
}

function ClassManagementActions({
  cls,
  position,
  actions,
}: Pick<ClassCardProps, 'cls' | 'position' | 'actions'>) {
  const name = cls.name.trim() || 'ohne Namen';
  return (
    <>
      <Button
        variant="outline"
        className="h-auto min-h-11 min-w-0 px-2"
        aria-haspopup="dialog"
        onPointerEnter={prepareTrainingDialogs}
        onFocus={prepareTrainingDialogs}
        onPointerDown={prepareTrainingDialogs}
        onClick={() => actions.onClear(cls.id)}
        title="Bilder dieser Klasse zurücksetzen"
        aria-label={`Bilder der Klasse ${position}: ${name} zurücksetzen`}
      >
        <RotateCcw data-icon="inline-start" aria-hidden="true" />
        <span className="hidden @md/training-class:inline">Zurücksetzen</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto min-h-11 min-w-0 px-2 text-destructive hover:text-destructive"
        aria-haspopup="dialog"
        onPointerEnter={prepareTrainingDialogs}
        onFocus={prepareTrainingDialogs}
        onPointerDown={prepareTrainingDialogs}
        onClick={() => actions.onRemove(cls.id)}
        title="Klasse löschen"
        aria-label={`Klasse ${position}: ${name} löschen`}
      >
        <Trash2 data-icon="inline-start" aria-hidden="true" />
        <span className="hidden @md/training-class:inline">Löschen</span>
      </Button>
    </>
  );
}

const ClassCard = memo(function ClassCard({
  cls,
  position,
  isDuplicate,
  actions,
  cameraFallback,
  ...camera
}: ClassCardProps) {
  const { onRemoveImages, onImageClick } = actions;
  const showCamera = camera.stream || camera.isCameraSwitching;
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
    <Card className="@container/training-class gap-4 py-4">
      <ClassHeader cls={cls} position={position} isDuplicate={isDuplicate} actions={actions} />
      <CardContent
        className={cn(
          'grid min-w-0 gap-3 px-4 @md/training-class:px-5',
          showCamera && '@xl/training-class:grid-cols-[minmax(10rem,14rem)_minmax(0,1fr)]',
        )}
      >
        <CameraPreview
          {...camera}
          disabled={actions.captureDisabled || cls.images.length >= ML.MAX_IMAGES_PER_CLASS}
          isRecording={isRecording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onFileUpload={handleFileUpload}
          videoRef={videoRef}
          onCaptureIntent={prepareImageGallery}
          fileActions={<ClassManagementActions cls={cls} position={position} actions={actions} />}
        />
        {cameraFallback && <div className="col-span-full">{cameraFallback}</div>}
        <ImageGallery
          className={
            showCamera ? '@xl/training-class:h-auto @xl/training-class:[contain:size]' : undefined
          }
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
