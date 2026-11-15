/** Composes browser resources and local training data for the static training route. */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ML } from '../constants';
import { useAppError } from './useAppError';
import { useConsentFlow } from './useConsentFlow';
import { useModalState } from './useModalState';
import { useImageFeatureExtraction } from './useImageFeatureExtraction';
import { useModelLoader } from './useModelLoader';
import { useCameraStream } from './useCameraStream';
import { usePredictionLoop } from './usePredictionLoop';
import { useModelTraining } from './useModelTraining';
import { useClassManagement } from './useClassManagement';
import { useImageActivity } from './useImageActivity';

function useTrainingResources() {
  const errors = useAppError();
  const consent = useConsentFlow();
  const [hasTrainedModel, setHasTrainedModel] = useState(false);
  const predictVideoRef = useRef<HTMLVideoElement>(null);
  const mainHeadingRef = useRef<HTMLHeadingElement>(null);
  const models = useModelLoader(consent.hasConsented, errors.setError);
  const canUseModels =
    !models.isModelLoading && models.classifier !== null && models.mobilenetModel !== null;
  const showCameraPrompt = consent.showCameraModal && canUseModels;
  const camera = useCameraStream(
    consent.cameraConsent && canUseModels,
    models.isModelLoading,
    predictVideoRef,
    errors.setError,
  );
  const prediction = usePredictionLoop(
    models.classifier,
    models.mobilenetModel,
    predictVideoRef,
    errors.setError,
    camera.facingMode === 'user',
  );
  const { stopPredicting, startPredicting: activatePrediction } = prediction;
  const invalidateModel = useCallback(() => {
    setHasTrainedModel(false);
    stopPredicting();
  }, [stopPredicting]);
  const startPredicting = useCallback(() => {
    if (hasTrainedModel && camera.stream) activatePrediction();
  }, [hasTrainedModel, camera.stream, activatePrediction]);
  const { cameraConsent, cameraDeclined, hasConsented } = consent;
  useEffect(() => {
    if ((cameraConsent || cameraDeclined) && hasConsented && canUseModels)
      mainHeadingRef.current?.focus();
  }, [cameraConsent, cameraDeclined, hasConsented, canUseModels]);
  return {
    errors,
    consent,
    models,
    camera,
    prediction,
    invalidateModel,
    startPredicting,
    hasTrainedModel,
    setHasTrainedModel,
    predictVideoRef,
    mainHeadingRef,
    showCameraPrompt,
  };
}

function useTrainingData(resources: ReturnType<typeof useTrainingResources>) {
  const { models, errors, prediction, invalidateModel, setHasTrainedModel, camera } = resources;
  const { setError } = errors;
  const onWarning = useCallback((message: string) => setError('validation', message), [setError]);
  const classes = useClassManagement(invalidateModel, onWarning);
  const duplicateClassNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const cls of classes.classes) {
      const name = cls.name.trim();
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return new Set([...counts].filter(([, count]) => count > 1).map(([name]) => name));
  }, [classes.classes]);
  const hasDuplicateNames = duplicateClassNames.size > 0;
  const training = useModelTraining(
    classes.classes,
    {
      setClassifier: models.setClassifier,
      setHasTrainedModel,
      onError: errors.setError,
    },
    hasDuplicateNames,
  );
  const { extractFeatures } = useImageFeatureExtraction(models.mobilenetModel);
  const activity = useImageActivity(training.isTrainingActive, onWarning);
  const { beginImage, endImage } = activity;
  const { isTrainingActive } = training;
  const { classes: classData, addImage: appendImage } = classes;
  const addImage = useCallback(
    async (classId: string, source: HTMLVideoElement | HTMLImageElement, mirror: boolean) => {
      const targetClass = classData.find((cls) => cls.id === classId);
      if (!targetClass || targetClass.images.length >= ML.MAX_IMAGES_PER_CLASS) return;
      if (isTrainingActive()) {
        onWarning('Bitte warte, bis das Training abgeschlossen ist.');
        return;
      }
      beginImage();
      try {
        const image = await extractFeatures(source, mirror, source instanceof HTMLImageElement);
        if (image) {
          appendImage(classId, image, targetClass.captureVersion ?? 0);
          invalidateModel();
        }
      } catch {
        onWarning('Das Bild konnte nicht verarbeitet werden. Bitte versuche es erneut.');
      } finally {
        endImage();
      }
    },
    [
      isTrainingActive,
      classData,
      appendImage,
      extractFeatures,
      invalidateModel,
      onWarning,
      beginImage,
      endImage,
    ],
  );
  const trainModel = () => {
    if (activity.isBusy()) {
      onWarning('Bitte warte, bis alle Bilder vollständig verarbeitet sind.');
      return;
    }
    errors.clearError();
    prediction.stopPredicting();
    void training.trainModel();
  };
  return {
    classes,
    duplicateClassNames,
    hasDuplicateNames,
    training,
    activity,
    canTrain: training.canTrain && !activity.hasUploads,
    addImage,
    trainModel,
    onWarning,
    facingMode: camera.facingMode,
  };
}

export function useTrainingWorkspace() {
  const resources = useTrainingResources();
  const data = useTrainingData(resources);
  const dialogs = useModalState();
  const { removeImages, updateClassName } = data.classes;
  const { modal, closeModal, showRemoveClass, showClearClass, showImagePreview } = dialogs;
  const handleRemoveImages = useCallback(
    (classId: string, imageIds: string[]) => {
      removeImages(classId, imageIds);
      if (
        modal.type === 'imagePreview' &&
        modal.classId === classId &&
        imageIds.includes(modal.image.id)
      )
        closeModal();
    },
    [removeImages, modal, closeModal],
  );
  const { addImage, facingMode, onWarning } = data;
  const { beginUpload, endUpload } = data.activity;
  const captureDisabled = data.training.isTraining;
  const cardActions = useMemo(
    () => ({
      onAddExample: (id: string, video: HTMLVideoElement) => {
        void addImage(id, video, facingMode === 'user');
      },
      onAddImageExample: (id: string, image: HTMLImageElement) => addImage(id, image, false),
      onRemove: showRemoveClass,
      onClear: showClearClass,
      onRemoveImages: handleRemoveImages,
      onUpdateName: updateClassName,
      onImageClick: showImagePreview,
      onError: onWarning,
      onUploadStart: beginUpload,
      onUploadEnd: endUpload,
      captureDisabled,
    }),
    [
      addImage,
      facingMode,
      onWarning,
      showRemoveClass,
      showClearClass,
      showImagePreview,
      handleRemoveImages,
      updateClassName,
      beginUpload,
      endUpload,
      captureDisabled,
    ],
  );
  return { resources, data, dialogs, cardActions };
}
