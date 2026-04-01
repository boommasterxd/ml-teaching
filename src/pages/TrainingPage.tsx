/**
 * Training page where users can collect image data for different classes,
 * train a custom KNN classifier on top of MobileNet, and test the model in real-time.
 */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  Plus, Trash2,
  AlertCircle, SwitchCamera, RotateCcw,
} from 'lucide-react';

import type { MLClass, MLImage } from '../types/ml';
import { useAppError } from '../hooks/useAppError';
import { useConsentFlow } from '../hooks/useConsentFlow';
import { useModalState } from '../hooks/useModalState';
import { useImageFeatureExtraction } from '../hooks/useImageFeatureExtraction';
import { useModelLoader } from '../hooks/useModelLoader';
import { useCameraStream } from '../hooks/useCameraStream';
import { usePredictionLoop } from '../hooks/usePredictionLoop';
import { useModelTraining } from '../hooks/useModelTraining';
import { useClassManagement } from '../hooks/useClassManagement';

import PageHeader from '../components/PageHeader';
import ClassCard from '../components/ClassCard';
import TrainingControls from '../components/TrainingControls';
import PredictionPanel from '../components/PredictionPanel';
import ConfirmDialog from '../components/modals/ConfirmDialog';
import ImagePreviewModal from '../components/modals/ImagePreviewModal';
import ConsentModal from '../components/modals/ConsentModal';
import CameraConsentModal from '../components/modals/CameraConsentModal';
import LoadingModal from '../components/modals/LoadingModal';

/** Main training page: consent → model loading → data collection → training → live prediction. */
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
    usePredictionLoop(classifier, mobilenetModel, predictVideoRef);

  /** Resets the trained model flag and stops prediction when training data changes. */
  const invalidateModel = useCallback(() => {
    if (hasTrainedModel) {
      setHasTrainedModel(false);
      stopPredicting();
    }
  }, [hasTrainedModel, stopPredicting]);

  const {
    classes, addClass, removeClass, updateClassName,
    addImage, removeImage, removeImages, clearClass, resetClasses,
  } = useClassManagement(invalidateModel);

  const { isTraining, trainModel: runTraining, canTrain, hasInvalidNames, hasDuplicateNames } =
    useModelTraining(classes, classifier, setClassifier, setHasTrainedModel, setError);

  /** Clears any previous error before starting a new training run. */
  const trainModel = useCallback(() => {
    clearError();
    runTraining();
  }, [clearError, runTraining]);

  const { extractFeatures } = useImageFeatureExtraction(mobilenetModel);

  /** Starts prediction only if a trained model exists. */
  const startPredicting = useCallback(() => {
    if (hasTrainedModel) activatePredicting();
  }, [hasTrainedModel, activatePredicting]);

  /** Captures a frame from the source, extracts MobileNet features, and adds it to a class. */
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

  const addExample = useCallback((classId: string, videoElement: HTMLVideoElement) => {
    addImageToClass(classId, videoElement, facingMode === 'user');
  }, [addImageToClass, facingMode]);

  const addImageExample = useCallback((classId: string, imageElement: HTMLImageElement) => {
    addImageToClass(classId, imageElement, false);
  }, [addImageToClass]);

  /** Pre-computed set of class names that appear more than once (O(n) vs O(n²) per render). */
  const duplicateClassNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of classes) {
      const name = c.name.trim();
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([name]) => name));
  }, [classes]);

  /** Resets all classes, the trained model, and prediction state. */
  const clearAll = useCallback(() => {
    resetClasses();
    setHasTrainedModel(false);
    stopPredicting();
    if (classifier) classifier.clearAllClasses();
    closeModal();
  }, [classifier, stopPredicting, resetClasses, closeModal]);

  /** Removes a single image and closes the preview modal if it was showing that image. */
  const handleRemoveImage = useCallback((classId: string, imageId: string) => {
    removeImage(classId, imageId);
    closeModal();
  }, [removeImage, closeModal]);

  /** Removes multiple images from a class. */
  const handleRemoveImages = useCallback((classId: string, imageIds: string[]) => {
    removeImages(classId, imageIds);
    if (modal.type === 'imagePreview' && modal.classId === classId && imageIds.includes(modal.image.id)) {
      closeModal();
    }
  }, [removeImages, modal, closeModal]);

  /** Clears all images from a class. */
  const handleClearClass = useCallback((id: string) => {
    clearClass(id);
    if (modal.type === 'imagePreview' && modal.classId === id) {
      closeModal();
    }
  }, [clearClass, modal, closeModal]);

  /** Opens the image preview modal for the selected training image. */
  const handleImageClick = useCallback((classId: string, img: MLImage) => {
    showImagePreview(classId, img);
  }, [showImagePreview]);

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
        <div className="lg:col-span-7 space-y-6">
          <div className="flex justify-between items-center">
            <h2 ref={mainHeadingRef} tabIndex={-1} className="text-lg font-bold text-zinc-800 focus:outline-none">1. Klassen ({classes.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={showClearConfirm}
                className="flex items-center px-3 sm:px-4 py-2 bg-white border border-zinc-200 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl text-sm font-medium transition-colors shadow-sm"
                title="Alles zurücksetzen"
                aria-label="Alle Klassen und Bilder zurücksetzen"
              >
                <RotateCcw className="w-4 h-4 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Zurücksetzen</span>
              </button>
              <button
                onClick={addClass}
                className="flex items-center px-3 sm:px-4 py-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl text-sm font-medium transition-colors shadow-sm"
                aria-label="Neue Klasse hinzufügen"
              >
                <Plus className="w-4 h-4 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Hinzufügen</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {classes.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-2xl border border-zinc-200 border-dashed">
                <p className="text-zinc-600 text-sm">Keine Klassen vorhanden. Füge Klassen hinzu, um zu starten.</p>
              </div>
            ) : (
              classes.map((cls: MLClass) => (
                <ClassCard
                  key={cls.id}
                  cls={cls}
                  isDuplicate={duplicateClassNames.has(cls.name.trim())}
                  stream={stream}
                  facingMode={facingMode}
                  onAddExample={addExample}
                  onAddImageExample={addImageExample}
                  onRemove={showRemoveClass}
                  onClear={showClearClass}
                  onRemoveImages={handleRemoveImages}
                  onUpdateName={updateClassName}
                  onImageClick={handleImageClick}
                />
              ))
            )}
          </div>
        </div>

        {/* Right column: training & prediction */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
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
      <ImagePreviewModal
        isOpen={modal.type === 'imagePreview'}
        onClose={closeModal}
        image={modal.type === 'imagePreview' ? modal.image : null}
        onDelete={() => modal.type === 'imagePreview' && handleRemoveImage(modal.classId, modal.image.id)}
      />

      <ConfirmDialog
        isOpen={modal.type === 'clearConfirm'}
        onClose={closeModal}
        onConfirm={clearAll}
        titleId="clear-modal-title"
        descId="clear-modal-desc"
        title="Daten unwiderruflich löschen?"
        description="Möchten Sie wirklich alle erfassten Klassen und Bilddaten löschen? Das aktuell trainierte Modell wird dabei unwiderruflich entfernt und der Vorgang kann nicht rückgängig gemacht werden."
        confirmLabel="Unwiderruflich löschen"
        icon={<AlertCircle className="w-6 h-6" />}
      />

      <ConfirmDialog
        isOpen={modal.type === 'clearClass'}
        onClose={closeModal}
        onConfirm={() => { if (modal.type === 'clearClass') { handleClearClass(modal.classId); closeModal(); } }}
        titleId="class-clear-modal-title"
        descId="class-clear-modal-description"
        title="Bilder dieser Klasse löschen?"
        description={
          <>Möchten Sie wirklich alle Bilder der Klasse{' '}
            <strong>"{modal.type === 'clearClass' ? classes.find(c => c.id === modal.classId)?.name : ''}"</strong>{' '}
            unwiderruflich löschen?</>
        }
        confirmLabel="Zurücksetzen"
        icon={<RotateCcw className="w-6 h-6" />}
      />

      <ConfirmDialog
        isOpen={modal.type === 'removeClass'}
        onClose={closeModal}
        onConfirm={() => { if (modal.type === 'removeClass') { removeClass(modal.classId); closeModal(); } }}
        titleId="class-remove-modal-title"
        descId="class-remove-modal-description"
        title="Klasse löschen?"
        description={
          <>Möchten Sie die Klasse{' '}
            <strong>"{modal.type === 'removeClass' ? classes.find(c => c.id === modal.classId)?.name : ''}"</strong>{' '}
            und alle zugehörigen Bilder wirklich entfernen?</>
        }
        confirmLabel="Löschen"
        icon={<Trash2 className="w-6 h-6" />}
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
