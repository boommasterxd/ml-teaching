/** Composes browser resources and local training data for the static training route. */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { toast } from '@/lib/toast';
import { ML } from '../constants';
import type { ErrorCategory } from '../types/errors';
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

function notifyError(message: string) {
  toast.error(message);
}

function reportOperationError(category: Exclude<ErrorCategory, 'model'>, message: string) {
  // The class fields and training controls already explain invalid input in place.
  if (category !== 'validation') notifyError(message);
}

function useTrainingResources() {
  const { error, setError, clearError } = useAppError();
  const consent = useConsentFlow();
  const [hasTrainedModel, setHasTrainedModel] = useState(false);
  const predictVideoRef = useRef<HTMLVideoElement>(null);
  const mainHeadingRef = useRef<HTMLHeadingElement>(null);
  const models = useModelLoader(consent.hasConsented, setError);
  const { setClassifier } = models;
  const canUseModels = !models.isModelLoading && models.mobilenetModel !== null;
  const showCameraPrompt = consent.showCameraModal && canUseModels;
  const camera = useCameraStream(
    consent.cameraConsent && canUseModels,
    models.isModelLoading,
    reportCameraError,
  );
  const prediction = usePredictionLoop(
    models.classifier,
    models.mobilenetModel,
    predictVideoRef,
    reportOperationError,
    camera.facingMode === 'user',
  );
  const { stopPredicting, startPredicting: activatePrediction } = prediction;
  function reportCameraError(category: 'camera', message: string) {
    stopPredicting();
    setError(category, message);
  }
  const { retryCamera: requestCameraRetry } = camera;
  const retryCamera = useCallback(() => {
    if (error?.category === 'camera') clearError();
    requestCameraRetry();
  }, [error?.category, clearError, requestCameraRetry]);
  const invalidateModel = useCallback(() => {
    stopPredicting();
    setClassifier(null);
    setHasTrainedModel(false);
  }, [setClassifier, stopPredicting]);
  const startPredicting = useCallback(() => {
    if (hasTrainedModel && camera.stream) activatePrediction();
  }, [hasTrainedModel, camera.stream, activatePrediction]);
  const { cameraConsent, cameraDeclined, hasConsented } = consent;
  useEffect(() => {
    if ((cameraConsent || cameraDeclined) && hasConsented && canUseModels)
      mainHeadingRef.current?.focus({ preventScroll: true });
  }, [cameraConsent, cameraDeclined, hasConsented, canUseModels]);
  return {
    error,
    consent,
    models,
    camera: { ...camera, retryCamera },
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
  const { models, prediction, invalidateModel, setHasTrainedModel, camera } = resources;
  const classes = useClassManagement(invalidateModel, notifyError);
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
      onError: reportOperationError,
    },
    hasDuplicateNames,
  );
  const { extractFeatures } = useImageFeatureExtraction(models.mobilenetModel);
  const activity = useImageActivity(training.isTrainingActive, notifyError);
  const { beginImage, endImage } = activity;
  const { isTrainingActive } = training;
  const { classes: classData, addImage: appendImage } = classes;
  const addImage = useCallback(
    async (classId: string, source: HTMLVideoElement | HTMLImageElement, mirror: boolean) => {
      const targetClass = classData.find((cls) => cls.id === classId);
      if (!targetClass || targetClass.images.length >= ML.MAX_IMAGES_PER_CLASS) return;
      if (isTrainingActive()) {
        notifyError('Bitte warte, bis das Training abgeschlossen ist.');
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
        throw new Error('Das Bild konnte nicht verarbeitet werden. Bitte versuche es erneut.');
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
      beginImage,
      endImage,
    ],
  );
  const trainModel = () => {
    if (activity.isBusy()) {
      notifyError('Bitte warte, bis alle Bilder vollständig verarbeitet sind.');
      return;
    }
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
  const { addImage, facingMode } = data;
  const { beginUpload, endUpload } = data.activity;
  const captureDisabled = data.training.isTraining;
  const cardActions = useMemo(
    () => ({
      onAddExample: (id: string, video: HTMLVideoElement) =>
        addImage(id, video, facingMode === 'user'),
      onAddImageExample: (id: string, image: HTMLImageElement) => addImage(id, image, false),
      onRemove: showRemoveClass,
      onClear: showClearClass,
      onRemoveImages: handleRemoveImages,
      onUpdateName: updateClassName,
      onImageClick: showImagePreview,
      onError: notifyError,
      onUploadStart: beginUpload,
      onUploadEnd: endUpload,
      captureDisabled,
    }),
    [
      addImage,
      facingMode,
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
