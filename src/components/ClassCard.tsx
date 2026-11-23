/**
 * ClassCard.tsx
 *
 * Card component representing a single ML class.
 * Orchestrates camera recording, image upload, and thumbnail gallery via subcomponents.
 */
import { memo, useCallback, useState } from 'react';
import { useClassCapture } from '../hooks/useClassCapture';
import type { CaptureActions } from '../hooks/useClassCapture';
import { ML } from '../constants';
import type { MLClass, MLImage } from '../types/ml';
import CameraPreview from './CameraPreview';
import type { CameraPreviewProps } from './CameraPreview';
import { prepareTrainingDialogs } from './DeferredTrainingDialogs';
import ImageGallery, { prepareImageGallery } from './ImageGallery';
import { FieldError } from './ui/field';
import TrainingClassFrame, {
  ClassManagementActions,
  TrainingClassNameField,
  trainingGalleryLabel,
} from './TrainingClassFrame';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

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
interface ClassCardProps extends Pick<CameraPreviewProps, 'camera'> {
  position: number;
  /** The ML class data to display and manage. */
  cls: MLClass;
  nameError?: string;
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
  error?: string;
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
          <TrainingClassNameField
            id={id}
            value={name}
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
            aria-invalid={!!error}
            aria-errormessage={error ? errorId : undefined}
            aria-describedby={error ? errorId : undefined}
          />
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

const ClassCard = memo(function ClassCard({
  cls,
  position,
  nameError,
  actions,
  camera,
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
    <TrainingClassFrame
      cls={cls}
      position={position}
      nameError={nameError}
      nameField={
        <ClassNameInput
          id={`class-name-${cls.id}`}
          name={cls.name}
          error={nameError}
          onChange={(name) => actions.onUpdateName(cls.id, name)}
        />
      }
    >
      <CameraPreview
        camera={camera}
        disabled={actions.captureDisabled || cls.images.length >= ML.MAX_IMAGES_PER_CLASS}
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onFileUpload={handleFileUpload}
        videoRef={videoRef}
        onCaptureIntent={prepareImageGallery}
        fileActions={
          <ClassManagementActions
            cls={cls}
            position={position}
            onClear={() => actions.onClear(cls.id)}
            onRemove={() => actions.onRemove(cls.id)}
            onPrepare={prepareTrainingDialogs}
          />
        }
      />
      <ImageGallery
        label={trainingGalleryLabel(cls, position)}
        images={cls.images}
        color={cls.color}
        onImageClick={handleImageClick}
        onRemoveImages={handleRemoveImages}
      />
    </TrainingClassFrame>
  );
});

export default ClassCard;
