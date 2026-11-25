/**
 * ClassCard.tsx
 *
 * Card component representing a single ML class.
 * Orchestrates camera recording, image upload, and thumbnail gallery via subcomponents.
 */
import { memo, useCallback, type ComponentProps } from 'react';
import { useIsPresent } from 'motion/react';
import type { Control } from 'react-hook-form';
import { useClassCapture } from '../hooks/useClassCapture';
import type { CaptureActions } from '../hooks/useClassCapture';
import { useTrainingClassName } from '../hooks/useClassManagement';
import type { TrainingClassNames } from '@/lib/training-class-names';
import { ML } from '../constants';
import type { MLClass, MLImage } from '../types/ml';
import CameraPreview from './CameraPreview';
import type { CameraPreviewProps } from './CameraPreview';
import { prepareTrainingDialogs, type PendingTrainingDialog } from './DeferredTrainingDialogs';
import ImageGallery, { prepareImageGallery } from './ImageGallery';
import TrainingClassFrame, {
  ClassManagementActions,
  trainingClassLabel,
  TrainingClassNameField,
  trainingGalleryLabel,
} from './TrainingClassFrame';
import { FieldError } from './ui/field';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

/**
 * Callback actions for the ClassCard component, grouped to reduce prop count.
 */
export interface ClassCardActions extends CaptureActions {
  /** Called to request removal of the entire class. */
  onRemove: (classId: string) => void;
  /** Called to clear all images from the class without removing it. */
  onClear: (classId: string) => void;
  /** Called to remove a specific subset of images by their IDs. */
  onRemoveImages: (classId: string, ids: string[]) => void;
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
  nameControl: Control<TrainingClassNames>;
  validateNames: () => void;
  /** Grouped callback actions for class management and user interactions. */
  actions: ClassCardActions;
  pendingDialog?: PendingTrainingDialog;
}

function EditableClassName({
  id,
  error,
  ...props
}: ComponentProps<typeof TrainingClassNameField> & { id: string; error?: string }) {
  const errorId = `${id}-error`;
  return (
    <Tooltip triggerId={id} open={Boolean(error)} disabled={!error}>
      <TooltipTrigger
        closeOnClick={false}
        aria-describedby={error ? errorId : undefined}
        aria-errormessage={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        render={<TrainingClassNameField {...props} />}
      />
      <TooltipContent collisionPadding={12} aria-hidden="true">
        {error}
      </TooltipContent>
      <FieldError id={errorId} role="status" className="sr-only">
        {error}
      </FieldError>
    </Tooltip>
  );
}

const ClassCard = memo(function ClassCard({
  cls,
  position,
  nameControl,
  validateNames,
  actions,
  pendingDialog,
  camera,
}: ClassCardProps) {
  const { onRemoveImages, onImageClick } = actions;
  const { field, error, edit } = useTrainingClassName(nameControl, position - 1, validateNames);
  const present = useIsPresent();
  const value = present ? field.value : cls.name;
  const nameError = present ? error : undefined;
  const { videoRef, isRecording, isUploading, startRecording, stopRecording, handleFileUpload } =
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
      collectingImages={isRecording || isUploading}
      nameField={
        <EditableClassName
          {...field}
          id={`class-name-${cls.id}`}
          value={value}
          error={nameError}
          onChange={(event) => edit(event.currentTarget.value)}
        />
      }
    >
      <CameraPreview
        camera={camera}
        classLabel={trainingClassLabel(cls, position)}
        remainingCapacity={ML.MAX_IMAGES_PER_CLASS - cls.images.length}
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
            pendingAction={pendingDialog?.type}
          />
        }
      />
      <ImageGallery
        label={trainingGalleryLabel(cls, position)}
        images={cls.images}
        color={cls.color}
        onImageClick={handleImageClick}
        onRemoveImages={handleRemoveImages}
        pendingImageId={pendingDialog?.type === 'imagePreview' ? pendingDialog.image.id : undefined}
      />
    </TrainingClassFrame>
  );
});

export default ClassCard;
