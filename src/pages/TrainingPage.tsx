/**
 * TrainingPage.tsx
 *
 * Core training page of the application. Orchestrates the full ML workflow:
 * consent dialogs → MobileNet + KNN model loading → per-class image capture
 * (camera or upload) → KNN training → live inference loop at 15 FPS.
 * All processing runs client-side via TensorFlow.js; no data leaves the browser.
 */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, SwitchCamera } from 'lucide-react';

import {
  useAppError, useConsentFlow, useModalState,
  useImageFeatureExtraction, useModelLoader,
  useCameraStream, usePredictionLoop,
  useModelTraining, useClassManagement, usePageTitle,
} from '../hooks';

import PageHeader from '../components/PageHeader';
import TrainingClassesPanel from '../components/TrainingClassesPanel';
import TrainingControls from '../components/TrainingControls';
import PredictionPanel from '../components/PredictionPanel';
import TrainingPageModals from '../components/TrainingPageModals';
import { ConsentModal, CameraConsentModal, LoadingModal } from '../components/modals';

/**
 * Main page component for the interactive ML training experience.
 *
 * Renders the full training UI: class management panel on the left,
 * training controls and live prediction panel on the right, plus all
 * modal dialogs (consent, loading, image preview, confirm dialogs).
 * Hook composition handles all state; this component is layout and wiring only.
 */
export default function TrainingPage() {
  const navigate = useNavigate();
  usePageTitle('Modell trainieren');

  const { error, setError, clearError } = useAppError();
  const { hasConsented, cameraConsent, grantConsent, grantCameraConsent, showConsentModal, showCameraModal } = useConsentFlow();
  const { modal, closeModal, showImagePreview, showClearConfirm, showClearClass, showRemoveClass } = useModalState();

  // Whether a trained model currently exists
  const [hasTrainedModel, setHasTrainedModel] = useState(false);
  // Shared video ref used by useCameraStream (stream attach) and usePredictionLoop (inference)
  const predictVideoRef = useRef<HTMLVideoElement>(null);
  const mainHeadingRef = useRef<HTMLHeadingElement>(null);

  const { classifier, setClassifier, mobilenetModel, isModelLoading, loadingText } =
    useModelLoader(hasConsented, setError);

  const { facingMode, stream, toggleCamera } =
    useCameraStream(cameraConsent, isModelLoading, predictVideoRef, setError);

  const { prediction, isPredicting, startPredicting: activatePredicting, stopPredicting } =
    usePredictionLoop(classifier, mobilenetModel, predictVideoRef, setError);

  /**
   * Resets the trained model flag and stops prediction when training data changes.
   */
  const invalidateModel = useCallback(() => {
    if (hasTrainedModel) {
      setHasTrainedModel(false);
      stopPredicting();
    }
  }, [hasTrainedModel, stopPredicting]);

  /**
   * Forwards validation warnings from class management to the global error state.
   *
   * Passed as the `onWarning` prop to `useClassManagement`. Called when a class
   * operation fails validation (e.g. duplicate name, missing images), routing
   * the message into `setError` under the `'validation'` category.
   *
   * @param message - Human-readable validation error message to display.
   */
  const onWarning = useCallback((message: string) => {
    setError('validation', message);
  }, [setError]);

  const {
    classes, addClass, removeClass, updateClassName,
    addImage, removeImage, removeImages, clearClass, resetClasses,
  } = useClassManagement(invalidateModel, onWarning);

  /**
   * Pre-computed set of class names that appear more than once (O(n) vs O(n²) per render).
   */
  const duplicateClassNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of classes) {
      const name = c.name.trim();
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([name]) => name));
  }, [classes]);

  const hasDuplicateNames = duplicateClassNames.size > 0;

  const { isTraining, trainModel: runTraining, canTrain, hasInvalidNames } =
    useModelTraining(classes, classifier, { setClassifier, setHasTrainedModel, onError: setError }, hasDuplicateNames);

  /**
   * Clears any previous error before starting a new training run.
   */
  const trainModel = useCallback(() => {
    clearError();
    runTraining();
  }, [clearError, runTraining]);

  const { extractFeatures } = useImageFeatureExtraction(mobilenetModel);

  /**
   * Starts prediction only if a trained model exists.
   */
  const startPredicting = useCallback(() => {
    if (hasTrainedModel) activatePredicting();
  }, [hasTrainedModel, activatePredicting]);

  /**
   * Captures a frame from the source, extracts MobileNet features, and adds it to a class.
   */
  const addImageToClass = useCallback(async (
    classId: string,
    source: HTMLVideoElement | HTMLImageElement,
    mirror: boolean
  ) => {
    const newImage = await extractFeatures(source, mirror);
    if (newImage) {
      addImage(classId, newImage);
      invalidateModel();
    }
  }, [extractFeatures, addImage, invalidateModel]);

  /**
   * Captures a frame from the live camera feed and adds it as a training example.
   * Mirrors the frame automatically when the front-facing camera is active.
   *
   * @param classId - ID of the target class.
   * @param videoElement - The video element providing the live camera stream.
   */
  const addExample = useCallback((classId: string, videoElement: HTMLVideoElement) => {
    addImageToClass(classId, videoElement, facingMode === 'user');
  }, [addImageToClass, facingMode]);

  /**
   * Adds a user-uploaded image as a training example for a class.
   * No mirroring is applied to uploaded images.
   *
   * @param classId - ID of the target class.
   * @param imageElement - The image element containing the uploaded image data.
   */
  const addImageExample = useCallback((classId: string, imageElement: HTMLImageElement) => {
    addImageToClass(classId, imageElement, false);
  }, [addImageToClass]);

  /**
   * Removes multiple images and closes the preview modal if the currently
   * previewed image is among the removed ones.
   */
  const handleRemoveImages = useCallback((classId: string, imageIds: string[]) => {
    removeImages(classId, imageIds);
    if (modal.type === 'imagePreview' && modal.classId === classId && imageIds.includes(modal.image.id)) {
      closeModal();
    }
  }, [removeImages, modal, closeModal]);

  // After all consent modals are done, focus the main content heading
  useEffect(() => {
    if (cameraConsent && hasConsented && !isModelLoading) {
      mainHeadingRef.current?.focus({ preventScroll: false });
    }
  }, [cameraConsent, hasConsented, isModelLoading]);

  return (
    <div className="bg-zinc-50 text-zinc-900 font-sans pb-20">
      <PageHeader
        title="Modell trainieren"
        rightSlot={
          <button
            onClick={toggleCamera}
            className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-full transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            title="Kamera wechseln"
            aria-label="Kamera wechseln"
          >
            <SwitchCamera className="w-5 h-5" aria-hidden="true" />
          </button>
        }
      />

      {error && (
        <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 lg:px-8">
          <div role="alert" aria-live="assertive" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start text-sm">
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <p>{error.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid lg:grid-cols-12 gap-6 items-start">

        {/* Left column: classes */}
        <TrainingClassesPanel
          classes={classes}
          duplicateClassNames={duplicateClassNames}
          stream={stream}
          facingMode={facingMode}
          mainHeadingRef={mainHeadingRef}
          cardActions={{
            onAddExample: addExample,
            onAddImageExample: addImageExample,
            onRemove: showRemoveClass,
            onClear: showClearClass,
            onRemoveImages: handleRemoveImages,
            onUpdateName: updateClassName,
            onImageClick: showImagePreview,
            onError: (msg) => setError('validation', msg),
          }}
          onAddClass={addClass}
          onShowClearConfirm={showClearConfirm}
        />

        {/* Right column: training & prediction */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 min-w-0">
          <TrainingControls
            classes={classes}
            canTrain={canTrain}
            isTraining={isTraining}
            hasTrainedModel={hasTrainedModel}
            hasInvalidNames={hasInvalidNames}
            hasDuplicateNames={hasDuplicateNames}
            onTrain={trainModel}
          />

          <PredictionPanel
            classes={classes}
            prediction={prediction}
            isPredicting={isPredicting}
            hasTrainedModel={hasTrainedModel}
            facingMode={facingMode}
            predictVideoRef={predictVideoRef}
            onStartPredicting={startPredicting}
            onStopPredicting={stopPredicting}
          />
        </div>
      </div>

      {/* Modal dialogs */}
      <TrainingPageModals
        modal={modal}
        classes={classes}
        classifier={classifier}
        closeModal={closeModal}
        removeImage={removeImage}
        clearClass={clearClass}
        removeClass={removeClass}
        resetClasses={resetClasses}
        setHasTrainedModel={setHasTrainedModel}
        stopPredicting={stopPredicting}
      />

      <ConsentModal
        isOpen={showConsentModal}
        onDecline={() => navigate('/')}
        onConfirm={grantConsent}
      />

      <LoadingModal
        isOpen={hasConsented && isModelLoading}
        loadingText={loadingText}
      />

      <CameraConsentModal
        isOpen={showCameraModal && !isModelLoading}
        onDecline={() => navigate('/')}
        onConfirm={grantCameraConsent}
      />
    </div>
  );
}
