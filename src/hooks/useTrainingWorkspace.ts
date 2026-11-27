/** Composes browser resources and local training data for the static training route. */
import { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { subscribeToVisibility } from '@/lib/document-visibility';
import { IMAGE_INPUT_LIMITS, IMAGE_UPLOAD_LIMIT_MESSAGE } from '@/lib/image-input-policy';
import { toast } from '@/lib/toast';
import type { TrainingStep } from '@/components/training-panel-loading';
import { ML } from '../constants';
import type { ErrorCategory } from '../types/errors';
import type { MLClass } from '../types/ml';
import { useModalState } from './useModalState';
import { useImageFeatureExtraction } from './useImageFeatureExtraction';
import type { TrainingEngine } from './useTrainingEngine';
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
  const [predictionVisible, setPredictionVisible] = useState(false);
  const predictionWanted = step === 'prediction' && hasTrainedModel;
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
    if (!predictionWanted || !predictionVisible || !visible || !camera.stream) return;
    activatePrediction();
    return stopPredicting;
  }, [
    predictionWanted,
    predictionVisible,
    visible,
    camera.stream,
    activatePrediction,
    stopPredicting,
  ]);
  useStopPredictionOnHide(stopPredicting);
  const { retryCamera, toggleCamera } = camera;
  const { cameraConsent, requestCameraConsent } = consent;
  const startCamera = useCallback(() => {
    setCameraPaused(false);
    if (!cameraConsent) {
      requestCameraConsent();
      return;
    }
    if (error?.category === 'camera') clearError();
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
    setClassifier(null);
    setHasTrainedModel(false);
  }, [setClassifier, stopPredicting]);
  function reportPredictionError(category: 'prediction', message: string) {
    invalidateModel();
    reportOperationError(category, message);
  }
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
    onPredictionVisibilityChange: setPredictionVisible,
    canAutoStartPrediction: visible && cameraConsent && !cameraPaused && !camera.hasFailed,
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

function findCurrentImageClass(classes: MLClass[], target: MLClass, signal?: AbortSignal) {
  if (signal?.aborted) return;
  return classes.find(
    ({ id, captureVersion }) => id === target.id && captureVersion === target.captureVersion,
  );
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
      target?: { signal: AbortSignal; receive?: CaptureTarget['receive'] },
    ) => {
      const targetClass = currentClasses.current.find((cls) => cls.id === classId);
      if (target?.signal.aborted || !targetClass) return;
      if (targetClass.images.length >= ML.MAX_IMAGES_PER_CLASS) return 'capacity' as const;
      const sourceStream = source instanceof HTMLVideoElement ? camera.streamRef.current : null;
      if (source instanceof HTMLVideoElement && (!sourceStream || document.hidden)) return;
      if (isTrainingActive()) {
        notifyError('Bitte warte, bis das Training abgeschlossen ist.');
        return;
      }
      beginImage();
      try {
        const image = await extractFeatures(source, mirror, source instanceof HTMLImageElement);
        const currentClass = findCurrentImageClass(
          currentClasses.current,
          targetClass,
          target?.signal,
        );
        if (
          image &&
          currentClass &&
          (!sourceStream || isCurrentCameraStream(sourceStream, camera.streamRef.current))
        ) {
          if (currentClass.images.length >= ML.MAX_IMAGES_PER_CLASS) return 'capacity' as const;
          if (target?.receive) target.receive(image);
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
      notifyError('Die Bilder werden noch geladen.');
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

function useUploadNotifications() {
  const active = useRef(new Set<string>());
  useEffect(() => {
    const ids = active.current;
    return () => {
      for (const id of ids) toast.dismiss(id);
      ids.clear();
    };
  }, []);
  return useCallback<CaptureActions['onUploadResult']>((classId, report) => {
    const id = `training-upload-${classId}`;
    if (!report) {
      if (active.current.delete(id)) toast.dismiss(id);
      return;
    }
    const total = report.total + report.capacitySkipped + report.batchSkipped;
    const title =
      total === 1
        ? 'Ein Bild konnte nicht hinzugefügt werden.'
        : `${total} Bilder konnten nicht hinzugefügt werden.`;
    const details = [...report.details];
    const remaining = report.total - details.length;
    if (remaining === 1) details.push('Eine weitere Datei ist fehlgeschlagen.');
    if (remaining > 1) details.push(`${remaining} weitere Dateien sind fehlgeschlagen.`);
    if (report.capacitySkipped) details.push(IMAGE_UPLOAD_LIMIT_MESSAGE);
    if (report.batchSkipped)
      details.push(
        `Wähle pro Import höchstens ${IMAGE_INPUT_LIMITS.MAX_FILES_PER_BATCH} Dateien aus.`,
      );
    if (report.total && report.className.trim()) details.unshift(report.className.trim());
    active.current.add(id);
    const showNotice = report.total ? toast.error : toast.info;
    showNotice(title, { id, timeout: 0, description: details.join('\n') });
  }, []);
}

export function useTrainingWorkspace(step: TrainingStep, engine: TrainingEngine) {
  const resources = useTrainingResources(step, engine);
  const data = useTrainingData(resources);
  const dialogs = useModalState();
  const onUploadResult = useUploadNotifications();
  const { removeImages } = data.classes;
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
      onAddExample: async (id: string, video: HTMLVideoElement, target?: CaptureTarget) => {
        await addImage(id, video, facingMode === 'user', target);
      },
      onCommitCapture: commitCapture,
      onAddImageExample: (id: string, image: HTMLImageElement, signal: AbortSignal) =>
        addImage(id, image, false, { signal }),
      onRemove: showRemoveClass,
      onClear: showClearClass,
      onRemoveImages: handleRemoveImages,
      onImageClick: showImagePreview,
      onError: notifyError,
      onUploadResult,
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
      onUploadResult,
      beginUpload,
      endUpload,
      captureDisabled,
    ],
  );
  return { resources, data, dialogs, cardActions };
}
