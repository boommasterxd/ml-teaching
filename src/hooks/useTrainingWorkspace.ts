/** Composes browser resources and local training data for the static training route. */
import { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { toast } from '@/lib/toast';
import type { TrainingStep } from '@/components/training-panel-loading';
import { ML } from '../constants';
import type { ErrorCategory } from '../types/errors';
import { useModalState } from './useModalState';
import { useImageFeatureExtraction } from './useImageFeatureExtraction';
import { subscribeToVisibility, type TrainingEngine } from './useTrainingEngine';
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

function useStopPredictionOnHide(stopPredicting: () => void) {
  useEffect(
    () =>
      subscribeToVisibility(() => {
        if (document.hidden) stopPredicting();
      }),
    [stopPredicting],
  );
}

function useTrainingResources(step: TrainingStep, engine: TrainingEngine) {
  const { error, clearError, consent, models, camera, canUseModels, visible, setCameraNeeded } =
    engine;
  const [hasTrainedModel, setHasTrainedModel] = useState(false);
  const predictVideoRef = useRef<HTMLVideoElement>(null);
  const { setClassifier } = models;
  const showCameraPrompt = consent.showCameraModal && canUseModels;
  const mainHeadingRef = useRef<HTMLHeadingElement>(null);
  const [cameraPaused, setCameraPaused] = useState(false);
  const [predictionFailed, setPredictionFailed] = useState(false);
  const predictionWanted = step === 'prediction' && hasTrainedModel && !predictionFailed;
  const cameraNeeded = !cameraPaused && (step === 'images' || predictionWanted);
  useLayoutEffect(() => {
    setCameraNeeded(cameraNeeded);
    return () => setCameraNeeded(true);
  }, [cameraNeeded, setCameraNeeded]);
  const prediction = usePredictionLoop(
    models.classifier,
    models.mobilenetModel,
    predictVideoRef,
    reportPredictionError,
    camera.facingMode === 'user',
  );
  const { stopPredicting, startPredicting: activatePrediction } = prediction;
  useLayoutEffect(() => {
    if (!predictionWanted || !visible || !camera.stream) return;
    activatePrediction();
    return stopPredicting;
  }, [predictionWanted, visible, camera.stream, activatePrediction, stopPredicting]);
  useStopPredictionOnHide(stopPredicting);
  function reportPredictionError(category: 'prediction', message: string) {
    stopPredicting();
    setPredictionFailed(true);
    reportOperationError(category, message);
  }
  const { retryCamera, toggleCamera } = camera;
  const { cameraConsent, requestCameraConsent } = consent;
  const startCamera = useCallback(() => {
    setCameraPaused(false);
    if (!cameraConsent) {
      requestCameraConsent();
      return;
    }
    if (error?.category === 'camera') clearError();
    setPredictionFailed(false);
    retryCamera();
  }, [cameraConsent, requestCameraConsent, error?.category, clearError, retryCamera]);
  const switchCamera = useCallback(() => {
    stopPredicting();
    toggleCamera();
  }, [stopPredicting, toggleCamera]);
  const pauseCamera = useCallback(() => {
    stopPredicting();
    setCameraPaused(true);
  }, [stopPredicting]);
  const invalidateModel = useCallback(() => {
    stopPredicting();
    setPredictionFailed(false);
    setClassifier(null);
    setHasTrainedModel(false);
  }, [setClassifier, stopPredicting]);
  return {
    error,
    consent,
    models,
    camera: {
      ...camera,
      active: cameraConsent && cameraNeeded && !camera.hasFailed,
      start: startCamera,
      pause: pauseCamera,
      toggleCamera: switchCamera,
    },
    prediction,
    invalidateModel,
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
  const currentClasses = useRef(classData);
  useLayoutEffect(() => {
    currentClasses.current = classData;
  }, [classData]);
  const addImage = useCallback(
    async (classId: string, source: HTMLVideoElement | HTMLImageElement, mirror: boolean) => {
      const targetClass = currentClasses.current.find((cls) => cls.id === classId);
      if (!targetClass || targetClass.images.length >= ML.MAX_IMAGES_PER_CLASS) return;
      const sourceStream = source instanceof HTMLVideoElement ? camera.streamRef.current : null;
      if (source instanceof HTMLVideoElement && (!sourceStream || document.hidden)) return;
      if (isTrainingActive()) {
        notifyError('Bitte warte, bis das Training abgeschlossen ist.');
        return;
      }
      beginImage();
      try {
        const image = await extractFeatures(source, mirror, source instanceof HTMLImageElement);
        const currentClass = currentClasses.current.find((cls) => cls.id === classId);
        if (
          image &&
          (!sourceStream || (sourceStream === camera.streamRef.current && !document.hidden)) &&
          currentClass &&
          currentClass.captureVersion === targetClass.captureVersion
        ) {
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
      camera.streamRef,
      appendImage,
      extractFeatures,
      invalidateModel,
      beginImage,
      endImage,
    ],
  );
  const trainModel = (completionFeedbackMs?: number) => {
    if (activity.isBusy()) {
      notifyError('Bitte warte, bis alle Bilder vollständig verarbeitet sind.');
      return;
    }
    prediction.stopPredicting();
    void training.trainModel(completionFeedbackMs);
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

export function useTrainingWorkspace(step: TrainingStep, engine: TrainingEngine) {
  const resources = useTrainingResources(step, engine);
  const data = useTrainingData(resources);
  const dialogs = useModalState();
  const { removeImages, updateClassName } = data.classes;
  const { modal, closeModal, showRemoveClass, showClearClass, showImagePreview } = dialogs;
  const currentModal = useRef(modal);
  useLayoutEffect(() => {
    currentModal.current = modal;
  }, [modal]);
  const handleRemoveImages = useCallback(
    (classId: string, imageIds: string[]) => {
      removeImages(classId, imageIds);
      const modal = currentModal.current;
      if (
        modal.type === 'imagePreview' &&
        modal.classId === classId &&
        imageIds.includes(modal.image.id)
      )
        closeModal();
    },
    [removeImages, closeModal],
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
