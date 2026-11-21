/** Composes browser resources and local training data for the static training route. */
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { toast } from '@/lib/toast';
import type { TrainingStep } from '@/components/training-panel-loading';
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

function subscribeToVisibility(notify: () => void) {
  document.addEventListener('visibilitychange', notify);
  return () => document.removeEventListener('visibilitychange', notify);
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

function useCameraPromptFocus(showCameraPrompt: boolean, canUseModels: boolean) {
  const mainHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousCameraPrompt = useRef(false);
  useEffect(() => {
    if (previousCameraPrompt.current && !showCameraPrompt && canUseModels) {
      mainHeadingRef.current?.focus({ preventScroll: true });
    }
    previousCameraPrompt.current = showCameraPrompt;
  }, [showCameraPrompt, canUseModels]);
  return mainHeadingRef;
}

function useTrainingResources(step: TrainingStep) {
  const { error, setError, clearError } = useAppError();
  const consent = useConsentFlow();
  const [hasTrainedModel, setHasTrainedModel] = useState(false);
  const predictVideoRef = useRef<HTMLVideoElement>(null);
  const models = useModelLoader(consent.hasConsented, setError);
  const { setClassifier } = models;
  const canUseModels = !models.isModelLoading && models.mobilenetModel !== null;
  const showCameraPrompt = consent.showCameraModal && canUseModels;
  const mainHeadingRef = useCameraPromptFocus(showCameraPrompt, canUseModels);
  const [predictionRequested, setPredictionRequested] = useState(false);
  const visible = useSyncExternalStore(
    subscribeToVisibility,
    () => !document.hidden,
    () => true,
  );
  const cameraNeeded =
    visible &&
    (step === 'images' || (step === 'prediction' && hasTrainedModel && predictionRequested));
  const camera = useCameraStream(
    consent.cameraConsent && canUseModels,
    models.isModelLoading,
    reportCameraError,
    cameraNeeded,
    handleCameraReady,
  );
  const prediction = usePredictionLoop(
    models.classifier,
    models.mobilenetModel,
    predictVideoRef,
    reportPredictionError,
    camera.facingMode === 'user',
  );
  const { stopPredicting: stopInference, startPredicting: activatePrediction } = prediction;
  const stopPredicting = useCallback(() => {
    stopInference();
    setPredictionRequested(false);
  }, [stopInference]);
  useStopPredictionOnHide(stopPredicting);
  function handleCameraReady() {
    if (step === 'prediction' && predictionRequested && !document.hidden) activatePrediction();
  }
  function reportPredictionError(category: 'prediction', message: string) {
    stopPredicting();
    reportOperationError(category, message);
  }
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
    if (step !== 'prediction' || !hasTrainedModel || !consent.cameraConsent || document.hidden)
      return;
    if (error?.category === 'camera') clearError();
    setPredictionRequested(true);
  }, [step, hasTrainedModel, consent.cameraConsent, error?.category, clearError]);
  const revokeCamera = () => {
    stopPredicting();
    consent.revokeCameraConsent();
    if (error?.category === 'camera') clearError();
  };
  return {
    error,
    consent,
    models,
    camera: { ...camera, retryCamera },
    prediction: { ...prediction, stopPredicting },
    invalidateModel,
    startPredicting,
    revokeCamera,
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

export function useTrainingWorkspace(step: TrainingStep = 'images') {
  const resources = useTrainingResources(step);
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
