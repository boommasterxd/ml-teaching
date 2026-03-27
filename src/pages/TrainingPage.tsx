/**
 * Training page where users can collect image data for different classes,
 * train a custom KNN classifier on top of MobileNet, and test the model in real-time.
 */
import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import * as tf from '@tensorflow/tfjs';
import {
  Plus, Trash2, Camera, Play, Square,
  AlertCircle, CheckCircle2, Loader2, SwitchCamera, Brain, RotateCcw,
} from 'lucide-react';
import { cn } from '../lib/utils';

import type { MLImage, MLClass } from '../types/ml';
import { ML } from '../constants';
import { useModelLoader } from '../hooks/useModelLoader';
import { useCameraStream } from '../hooks/useCameraStream';
import { usePredictionLoop } from '../hooks/usePredictionLoop';
import { useModelTraining } from '../hooks/useModelTraining';
import { useClassManagement } from '../hooks/useClassManagement';

import PageHeader from '../components/PageHeader';
import ClassCard from '../components/ClassCard';
import ConfirmDialog from '../components/modals/ConfirmDialog';
import ImagePreviewModal from '../components/modals/ImagePreviewModal';
import ConsentModal from '../components/modals/ConsentModal';
import CameraConsentModal from '../components/modals/CameraConsentModal';
import LoadingModal from '../components/modals/LoadingModal';

/** Main training page: consent → model loading → data collection → training → live prediction. */
export default function TrainingPage() {
  const navigate = useNavigate();
  usePageTitle('Modell trainieren');

  // Error state shared across multiple hooks
  const [error, setError] = useState<string | null>(null);

  // Consent flow: 1. hasConsented → model loading starts, 2. cameraConsent → camera access starts
  const [hasConsented, setHasConsented] = useState(false);
  const [cameraConsent, setCameraConsent] = useState(false);

  // Modal states
  const [selectedImage, setSelectedImage] = useState<{ classId: string; image: MLImage } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [classToClear, setClassToClear] = useState<string | null>(null);
  const [classToRemove, setClassToRemove] = useState<string | null>(null);

  // Whether a trained model currently exists (read/written from multiple places)
  const [hasTrainedModel, setHasTrainedModel] = useState(false);

  // Shared video ref used by useCameraStream (stream attach) and usePredictionLoop (inference)
  const predictVideoRef = useRef<HTMLVideoElement>(null);

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
    classes,
    addClass,
    removeClass,
    updateClassName,
    addImage,
    removeImage,
    removeImages,
    clearClass,
    resetClasses,
  } = useClassManagement(invalidateModel);

  const { isTraining, trainModel, canTrain, hasInvalidNames, hasDuplicateNames } =
    useModelTraining(classes, classifier, setClassifier, setHasTrainedModel, setError);

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
    if (!mobilenetModel) return;

    const sourceWidth = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    const sourceHeight = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
    if (sourceWidth === 0 || sourceHeight === 0) return;

    const img = tf.browser.fromPixels(source);
    const features = mobilenetModel.infer(img, true);
    const featureArray = Array.from(features.dataSync()) as number[];

    const canvas = document.createElement('canvas');
    canvas.width = ML.FEATURE_CANVAS_SIZE;
    canvas.height = ML.FEATURE_CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const size = Math.min(sourceWidth, sourceHeight);
      const startX = (sourceWidth - size) / 2;
      const startY = (sourceHeight - size) / 2;
      if (mirror) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(source, startX, startY, size, size, 0, 0, canvas.width, canvas.height);
    }
    const dataUrl = canvas.toDataURL('image/jpeg', ML.THUMBNAIL_QUALITY);

    const newImage: MLImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dataUrl,
      featureArray,
    };

    addImage(classId, newImage);
    invalidateModel();

    img.dispose();
    features.dispose();
  }, [mobilenetModel, addImage, invalidateModel]);

  const addExample = useCallback((classId: string, videoElement: HTMLVideoElement) => {
    addImageToClass(classId, videoElement, facingMode === 'user');
  }, [addImageToClass, facingMode]);

  const addImageExample = useCallback((classId: string, imageElement: HTMLImageElement) => {
    addImageToClass(classId, imageElement, false);
  }, [addImageToClass]);

  /** Resets all classes, the trained model, and prediction state. */
  const clearAll = useCallback(() => {
    resetClasses();
    setHasTrainedModel(false);
    stopPredicting();
    if (classifier) classifier.clearAllClasses();
    setShowClearConfirm(false);
    setSelectedImage(null);
  }, [classifier, stopPredicting, resetClasses]);

  /** Removes a single image and closes the preview modal if it was showing that image. */
  const handleRemoveImage = useCallback((classId: string, imageId: string) => {
    removeImage(classId, imageId);
    setSelectedImage(null);
  }, [removeImage]);

  const handleRemoveImages = useCallback((classId: string, imageIds: string[]) => {
    removeImages(classId, imageIds);
    setSelectedImage(prev =>
      prev && prev.classId === classId && imageIds.includes(prev.image.id) ? null : prev
    );
  }, [removeImages]);

  const handleClearClass = useCallback((id: string) => {
    clearClass(id);
    setSelectedImage(prev => prev?.classId === id ? null : prev);
  }, [clearClass]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-20">
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
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid lg:grid-cols-12 gap-6 items-start">

        {/* Left column: classes */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-zinc-800">1. Klassen ({classes.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(true)}
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
                  allClasses={classes}
                  stream={stream}
                  facingMode={facingMode}
                  onAddExample={(video) => addExample(cls.id, video)}
                  onAddImageExample={(img) => addImageExample(cls.id, img)}
                  onRemove={() => setClassToRemove(cls.id)}
                  onClear={() => setClassToClear(cls.id)}
                  onRemoveImages={(ids) => handleRemoveImages(cls.id, ids)}
                  onUpdateName={(name) => updateClassName(cls.id, name)}
                  onImageClick={(img) => setSelectedImage({ classId: cls.id, image: img })}
                />
              ))
            )}
          </div>
        </div>

        {/* Right column: training & prediction */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">

          {/* Training card */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/80 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-800 flex items-center">
                <Brain className="w-4 h-4 mr-2 text-indigo-500" aria-hidden="true" /> 2. Training
              </h2>
              {hasTrainedModel && (
                <span role="status" className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                  <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" /> Bereit
                </span>
              )}
            </div>
            <div className="p-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-600">Klassen bereit:</span>
                <span className={cn('font-semibold', canTrain ? 'text-emerald-700' : 'text-red-600')}>
                  {classes.filter(c => c.images.length >= ML.MIN_IMAGES_PER_CLASS).length} / {Math.max(ML.MIN_CLASSES, classes.length)}
                </span>
              </div>
              <div className="flex justify-between text-sm mb-5">
                <span className="text-zinc-600">Gesammelte Bilder:</span>
                <span className="font-semibold text-zinc-800">
                  {classes.reduce((acc, c) => acc + c.images.length, 0)}
                </span>
              </div>

              <button
                onClick={trainModel}
                disabled={isTraining || !canTrain}
                aria-disabled={isTraining || !canTrain}
                className={cn(
                  'w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                  isTraining || !canTrain
                    ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5'
                )}
              >
                {isTraining ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> Trainiere...</>
                ) : hasTrainedModel ? (
                  'Modell neu trainieren'
                ) : (
                  'Modell trainieren'
                )}
              </button>

              <p className="text-xs text-zinc-600 mt-3 text-center" aria-live="polite">
                {isTraining
                  ? 'Bitte warten, das Modell wird trainiert...'
                  : hasInvalidNames
                  ? 'Bitte gib allen Klassen einen Namen.'
                  : hasDuplicateNames
                  ? 'Bitte gib allen Klassen einen eindeutigen Namen.'
                  : !canTrain
                  ? `Sammle mind. ${ML.MIN_IMAGES_PER_CLASS} Bilder in ALLEN Klassen (mind. ${ML.MIN_CLASSES}).`
                  : hasTrainedModel
                  ? 'Modell ist bereit. Du kannst es jederzeit neu trainieren.'
                  : 'Genug Bilder gesammelt! Du kannst das Modell jetzt trainieren.'}
              </p>
            </div>
          </div>

          {/* Prediction card */}
          <div className={cn(
            'bg-white rounded-2xl shadow-sm border border-zinc-200/80 overflow-hidden flex flex-col flex-1 transition-opacity duration-300',
            !hasTrainedModel ? 'opacity-80 pointer-events-none' : 'opacity-100'
          )}>
            <div className="px-5 py-4 border-b border-zinc-100 flex justify-between items-center">
              <h2 className="text-base font-bold text-zinc-800 flex items-center">
                <Camera className="w-4 h-4 mr-2 text-indigo-500" aria-hidden="true" /> 3. Vorhersage
              </h2>
              {isPredicting && (
                <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" aria-hidden="true"></span>
                  Live
                </span>
              )}
            </div>

            <div className="p-5 flex flex-col flex-1">
              <div className="relative aspect-[16/10.25] bg-zinc-900 rounded-xl overflow-hidden mb-5 flex-shrink-0">
                <video
                  ref={predictVideoRef}
                  autoPlay
                  playsInline
                  muted
                  aria-label="Kameravorschau für Vorhersage"
                  className={cn(
                    'w-full h-full object-cover rounded-xl',
                    facingMode === 'user' ? 'transform scale-x-[-1]' : ''
                  )}
                />
                {!isPredicting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
                    <button
                      onClick={startPredicting}
                      className="px-5 py-2.5 bg-white text-zinc-900 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-transform flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                    >
                      <Play className="w-4 h-4 mr-2 fill-current" aria-hidden="true" /> Starten
                    </button>
                  </div>
                )}
              </div>

              {/* Prediction results */}
              <div className="flex-1 flex flex-col justify-center" aria-live="polite" aria-atomic="true">
                {isPredicting && prediction ? (
                  <div className="space-y-4">
                    <div className="text-center mb-2">
                      <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Erkannt</div>
                      <div className="text-2xl font-black text-zinc-800">
                        {classes.find(c => c.id === prediction.label)?.name || 'Unbekannt'}
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {classes.map(c => {
                        const conf = prediction.confidences[c.id] || 0;
                        return (
                          <div key={c.id} className="flex items-center text-xs">
                            <span className="w-20 truncate font-semibold text-zinc-600">{c.name}</span>
                            <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden mx-3">
                              <div
                                className="h-full rounded-full transition-all duration-200 ease-out"
                                style={{ width: `${conf * 100}%`, backgroundColor: c.color }}
                              />
                            </div>
                            <span className="w-10 text-right font-mono font-medium text-zinc-600">
                              {Math.round(conf * 100)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={stopPredicting}
                      className="w-full mt-4 py-2.5 px-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center border border-zinc-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
                    >
                      <Square className="w-4 h-4 mr-2 fill-current" aria-hidden="true" /> Stoppen
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-800 text-sm text-center">
                    Starte die Vorhersage, um Ergebnisse zu sehen.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal dialogs */}
      <ImagePreviewModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        image={selectedImage?.image ?? null}
        onDelete={() => selectedImage && handleRemoveImage(selectedImage.classId, selectedImage.image.id)}
      />

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={clearAll}
        titleId="clear-modal-title"
        descId="clear-modal-desc"
        title="Daten unwiderruflich löschen?"
        description="Möchten Sie wirklich alle erfassten Klassen und Bilddaten löschen? Das aktuell trainierte Modell wird dabei unwiderruflich entfernt und der Vorgang kann nicht rückgängig gemacht werden."
        confirmLabel="Unwiderruflich löschen"
        icon={<AlertCircle className="w-6 h-6" />}
      />

      <ConfirmDialog
        isOpen={!!classToClear}
        onClose={() => setClassToClear(null)}
        onConfirm={() => { if (classToClear) { handleClearClass(classToClear); setClassToClear(null); } }}
        titleId="class-clear-modal-title"
        descId="class-clear-modal-description"
        title="Bilder dieser Klasse löschen?"
        description={
          <>Möchten Sie wirklich alle Bilder der Klasse{' '}
            <strong>"{classes.find(c => c.id === classToClear)?.name}"</strong>{' '}
            unwiderruflich löschen?</>
        }
        confirmLabel="Zurücksetzen"
        icon={<RotateCcw className="w-6 h-6" />}
      />

      <ConfirmDialog
        isOpen={!!classToRemove}
        onClose={() => setClassToRemove(null)}
        onConfirm={() => { if (classToRemove) { removeClass(classToRemove); setClassToRemove(null); } }}
        titleId="class-remove-modal-title"
        descId="class-remove-modal-description"
        title="Klasse löschen?"
        description={
          <>Möchten Sie die Klasse{' '}
            <strong>"{classes.find(c => c.id === classToRemove)?.name}"</strong>{' '}
            und alle zugehörigen Bilder wirklich entfernen?</>
        }
        confirmLabel="Löschen"
        icon={<Trash2 className="w-6 h-6" />}
      />

      <ConsentModal
        isOpen={!hasConsented}
        onDecline={() => navigate('/')}
        onConfirm={() => setHasConsented(true)}
      />

      <LoadingModal
        isOpen={hasConsented && isModelLoading}
        loadingText={loadingText}
      />

      <CameraConsentModal
        isOpen={hasConsented && !isModelLoading && !cameraConsent}
        onDecline={() => navigate('/')}
        onConfirm={() => setCameraConsent(true)}
      />
    </div>
  );
}
