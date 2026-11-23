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
import type { CaptureActions, CaptureTarget } from './useClassCapture';

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
    canAutoStartPrediction:
      visible && cameraConsent && !cameraPaused && !camera.hasFailed && !predictionFailed,
    invalidateModel,
    hasTrainedModel,
    setHasTrainedModel,
    predictVideoRef,
    mainHeadingRef,
    showCameraPrompt,
  };
}

function isCurrentCameraStream(
  expected: HTMLVideoElement['srcObject'],
  current: MediaStream | null,
) {
  return Boolean(expected) && expected === current && !document.hidden;
}

function useTrainingImages(
  { models, camera, invalidateModel }: ReturnType<typeof useTrainingResources>,
  classes: ReturnType<typeof useClassManagement>,
  { beginImage, endImage }: ReturnType<typeof useImageActivity>,
  isTrainingActive: () => boolean,
) {
  const { extractFeatures } = useImageFeatureExtraction(models.mobilenetModel);
  const { classes: classData, addImage: appendImage, addImages: appendImages } = classes;
  const currentClasses = useRef(classData);
  useLayoutEffect(() => {
    currentClasses.current = classData;
  }, [classData]);
  const commitCapture = useCallback<CaptureActions['onCommitCapture']>(
    (classId, { images, version, stream }) => {
      const targetClass = currentClasses.current.find((cls) => cls.id === classId);
      if (
        !images.length ||
        !isCurrentCameraStream(stream, camera.streamRef.current) ||
        isTrainingActive() ||
        !targetClass ||
        (targetClass.captureVersion ?? 0) !== version ||
        targetClass.images.length >= ML.MAX_IMAGES_PER_CLASS
      )
        return;
      appendImages(classId, images, version);
      invalidateModel();
    },
    [appendImages, camera.streamRef, invalidateModel, isTrainingActive],
  );
  const addImage = useCallback(
    async (
      classId: string,
      source: HTMLVideoElement | HTMLImageElement,
      mirror: boolean,
      target?: CaptureTarget,
    ) => {
      const targetClass = currentClasses.current.find((cls) => cls.id === classId);
      if (
        target?.signal.aborted ||
        !targetClass ||
        targetClass.images.length >= ML.MAX_IMAGES_PER_CLASS
      )
        return;
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
          !target?.signal.aborted &&
          (!sourceStream || isCurrentCameraStream(sourceStream, camera.streamRef.current)) &&
          currentClass &&
          currentClass.captureVersion === targetClass.captureVersion
        ) {
          if (target) target.receive(image);
          else {
            appendImage(classId, image, targetClass.captureVersion ?? 0);
            invalidateModel();
          }
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
  return { addImage, commitCapture };
}

function useTrainingData(resources: ReturnType<typeof useTrainingResources>) {
  const { models, prediction, invalidateModel, setHasTrainedModel, camera } = resources;
  const classes = useClassManagement(invalidateModel, notifyError);
  const training = useModelTraining(
    classes.classes,
    {
      setClassifier: models.setClassifier,
      setHasTrainedModel,
      onError: reportOperationError,
    },
    { current: classes.nameValidity, read: classes.readNameValidity },
  );
  const activity = useImageActivity(training.isTrainingActive, notifyError);
  const images = useTrainingImages(resources, classes, activity, training.isTrainingActive);
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
    hasDuplicateNames: training.hasDuplicateNames,
    training,
    activity,
    canTrain: training.canTrain && !activity.hasUploads,
    ...images,
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
  const { addImage, commitCapture, facingMode } = data;
  const { beginUpload, endUpload } = data.activity;
  const captureDisabled = data.training.isTraining;
  const cardActions = useMemo(
    () => ({
      onAddExample: (id: string, video: HTMLVideoElement, target?: CaptureTarget) =>
        addImage(id, video, facingMode === 'user', target),
      onCommitCapture: commitCapture,
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
      commitCapture,
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
