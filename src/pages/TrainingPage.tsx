/**
 * Training page where users can collect image data for different classes,
 * train a custom KNN classifier on top of MobileNet, and test the model in real-time.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import { 
  ArrowLeft, Plus, Trash2, Camera, Play, Square, 
  AlertCircle, CheckCircle2, Loader2, SwitchCamera, Brain, X, Image as ImageIcon, Upload, RotateCcw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useFocusTrap } from '../hooks/useFocusTrap';
import useScrollLock from '../hooks/useScrollLock';

// Types
interface MLImage {
  id: string;
  dataUrl: string;
  featureArray: number[];
}

interface MLClass {
  id: string;
  name: string;
  images: MLImage[];
  color: string;
}

interface Prediction {
  label: string;
  confidences: { [label: string]: number };
}

const COLORS = ['#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777'];

export default function TrainingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Modell trainieren – KI Bilderkennung für Schüler';
  }, []);

  // App State
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Initialisiere TensorFlow.js...');
  const [error, setError] = useState<string | null>(null);
  
  // ML State
  const [classifier, setClassifier] = useState<knnClassifier.KNNClassifier | null>(null);
  const [mobilenetModel, setMobilenetModel] = useState<mobilenet.MobileNet | null>(null);
  
  // Data State
  const [classes, setClasses] = useState<MLClass[]>([
    { id: 'class-1', name: 'Klasse 1', images: [], color: COLORS[0] },
    { id: 'class-2', name: 'Klasse 2', images: [], color: COLORS[1] },
  ]);
  
  // Camera State
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [streamState, setStreamState] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Training & Inference State
  const [isTraining, setIsTraining] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [hasTrainedModel, setHasTrainedModel] = useState(false);
  
  // Modal State
  const [selectedImage, setSelectedImage] = useState<{classId: string, image: MLImage} | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [classToClear, setClassToClear] = useState<string | null>(null);
  const [classToRemove, setClassToRemove] = useState<string | null>(null);
  
  // Consent State
  const [hasConsented, setHasConsented] = useState(false);
  const [cameraConsent, setCameraConsent] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [modelChecked, setModelChecked] = useState(false);
  
  // Refs
  const requestRef = useRef<number>(undefined);
  const predictVideoRef = useRef<HTMLVideoElement>(null);

  // Focus Traps for Modals
  const selectedImageRef = useFocusTrap(!!selectedImage);
  const showClearConfirmRef = useFocusTrap(showClearConfirm);
  const classToClearRef = useFocusTrap(!!classToClear);
  const classToRemoveRef = useFocusTrap(!!classToRemove);
  const hasConsentedRef = useFocusTrap(!hasConsented);
  const isModelLoadingRef = useFocusTrap(hasConsented && isModelLoading);
  const cameraConsentRef = useFocusTrap(hasConsented && !isModelLoading && !cameraConsent);

  // Scroll Lock
  const isAnyModalOpen = !!selectedImage || showClearConfirm || !!classToClear || !!classToRemove || !hasConsented || isModelLoading || !cameraConsent;
  useScrollLock(isAnyModalOpen);

  // Initialize ML Models
  useEffect(() => {
    if (!hasConsented) return;

    async function initModels() {
      try {
        setLoadingText('Lade TensorFlow.js Backend...');
        await tf.ready();
        
        setLoadingText('Erstelle KNN Klassifikator...');
        const knn = knnClassifier.create();
        setClassifier(knn);
        
        setLoadingText('Lade MobileNet (Feature Extractor)...');
        const mn = await mobilenet.load({ version: 2, alpha: 1.0 });
        setMobilenetModel(mn);
        
        setIsModelLoading(false);
      } catch (err) {
        console.error("Error loading models:", err);
        setError("Fehler beim Laden der KI-Modelle. Bitte lade die Seite neu.");
        setIsModelLoading(false);
      }
    }
    
    initModels();
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [hasConsented]);

  // Main Webcam Setup
  const setupWebcam = useCallback(async () => {
    if (!cameraConsent) return;
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        // Stop existing stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        streamRef.current = stream;
        setStreamState(stream);
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setError("Kamerazugriff verweigert oder keine Kamera gefunden.");
      }
    }
  }, [facingMode, cameraConsent]);

  useEffect(() => {
    setupWebcam();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [setupWebcam]);

  // Attach stream to prediction video
  useEffect(() => {
    if (predictVideoRef.current && streamState) {
      predictVideoRef.current.srcObject = streamState;
    }
  }, [streamState, isModelLoading]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Add Example Logic
  const addExample = async (classId: string, videoElement: HTMLVideoElement) => {
    if (!mobilenetModel || !videoElement) return;
    
    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) return;

    const img = tf.browser.fromPixels(videoElement);
    const features = mobilenetModel.infer(img, true);
    const featureArray = Array.from(features.dataSync()) as number[];
    
    const canvas = document.createElement('canvas');
    // Increased resolution for better quality
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const size = Math.min(videoElement.videoWidth, videoElement.videoHeight);
      const startX = (videoElement.videoWidth - size) / 2;
      const startY = (videoElement.videoHeight - size) / 2;
      
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(videoElement, startX, startY, size, size, 0, 0, canvas.width, canvas.height);
    }
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    const newImage: MLImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dataUrl,
      featureArray
    };
    
    setClasses(prev => prev.map(c => 
      c.id === classId ? { ...c, images: [...c.images, newImage] } : c
    ));
    
    if (hasTrainedModel) {
      setHasTrainedModel(false);
      stopPredicting();
    }
    
    img.dispose();
    features.dispose();
  };

  const addImageExample = async (classId: string, imageElement: HTMLImageElement) => {
    if (!mobilenetModel || !imageElement) return;
    
    if (imageElement.width === 0 || imageElement.height === 0) return;

    const img = tf.browser.fromPixels(imageElement);
    const features = mobilenetModel.infer(img, true);
    const featureArray = Array.from(features.dataSync()) as number[];
    
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const size = Math.min(imageElement.width, imageElement.height);
      const startX = (imageElement.width - size) / 2;
      const startY = (imageElement.height - size) / 2;
      
      ctx.drawImage(imageElement, startX, startY, size, size, 0, 0, canvas.width, canvas.height);
    }
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    const newImage: MLImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dataUrl,
      featureArray
    };
    
    setClasses(prev => prev.map(c => 
      c.id === classId ? { ...c, images: [...c.images, newImage] } : c
    ));
    
    if (hasTrainedModel) {
      setHasTrainedModel(false);
      stopPredicting();
    }
    
    img.dispose();
    features.dispose();
  };

  // Prediction Loop
  const predictLoop = async () => {
    if (!classifier || !mobilenetModel || !predictVideoRef.current || classifier.getNumClasses() === 0) {
      return;
    }

    if (
      predictVideoRef.current.readyState >= 2 && 
      predictVideoRef.current.videoWidth > 0 && 
      predictVideoRef.current.videoHeight > 0
    ) {
      const img = tf.browser.fromPixels(predictVideoRef.current);
      const features = mobilenetModel.infer(img, true);
      
      try {
        const result = await classifier.predictClass(features);
        setPrediction({
          label: result.label,
          confidences: result.confidences
        });
      } catch (err) {
        console.error("Prediction error:", err);
      }
      
      img.dispose();
      features.dispose();
    }

    if (isPredicting) {
      requestRef.current = requestAnimationFrame(predictLoop);
    }
  };

  useEffect(() => {
    if (isPredicting) {
      requestRef.current = requestAnimationFrame(predictLoop);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      setPrediction(null);
    }
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPredicting, classifier, mobilenetModel]);

  const startPredicting = () => {
    if (!hasTrainedModel) return;
    setIsPredicting(true);
  };

  const stopPredicting = () => {
    setIsPredicting(false);
  };

  // Class Management
  const addClass = () => {
    setClasses(prev => {
      // Find the next available number for the default name
      let nextNum = 1;
      const existingNums = prev
        .map(c => {
          const match = c.name.match(/Klasse (\d+)/);
          return match ? parseInt(match[1], 10) : null;
        })
        .filter((n): n is number => n !== null);
      
      if (existingNums.length > 0) {
        nextNum = Math.max(...existingNums) + 1;
      } else if (prev.length > 0) {
        nextNum = prev.length + 1;
      }

      const newId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? `class-${crypto.randomUUID()}`
          : `class-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      return [...prev, { 
        id: newId, 
        name: `Klasse ${nextNum}`, 
        images: [],
        color: COLORS[(nextNum - 1) % COLORS.length]
      }];
    });
    
    if (hasTrainedModel) {
      setHasTrainedModel(false);
      stopPredicting();
    }
  };

  const removeClass = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    
    if (hasTrainedModel) {
      setHasTrainedModel(false);
      stopPredicting();
    }
  };

  const updateClassName = (id: string, newName: string) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
  };

  const removeImage = (classId: string, imageId: string) => {
    setClasses(prev => prev.map(c => 
      c.id === classId ? { ...c, images: c.images.filter(img => img.id !== imageId) } : c
    ));
    
    if (hasTrainedModel) {
      setHasTrainedModel(false);
      stopPredicting();
    }
    setSelectedImage(null);
  };

  const removeImages = (classId: string, imageIds: string[]) => {
    const idsToRemove = new Set(imageIds);
    setClasses(prev => prev.map(c => 
      c.id === classId ? { ...c, images: c.images.filter(img => !idsToRemove.has(img.id)) } : c
    ));
    
    if (hasTrainedModel) {
      setHasTrainedModel(false);
      stopPredicting();
    }

    // Clear selected image if it was among the ones removed
    if (selectedImage && selectedImage.classId === classId && idsToRemove.has(selectedImage.image.id)) {
      setSelectedImage(null);
    }
  };

  const clearClass = (id: string) => {
    setClasses(prev => prev.map(c => 
      c.id === id ? { ...c, images: [] } : c
    ));
    
    if (hasTrainedModel) {
      setHasTrainedModel(false);
      stopPredicting();
    }

    // Clear selected image if it belonged to the cleared class
    if (selectedImage && selectedImage.classId === id) {
      setSelectedImage(null);
    }
  };

  const clearAll = () => {
    setClasses([
      { id: 'class-1', name: 'Klasse 1', images: [], color: COLORS[0] },
      { id: 'class-2', name: 'Klasse 2', images: [], color: COLORS[1] },
    ]);
    setHasTrainedModel(false);
    stopPredicting();
    if (classifier) {
      classifier.clearAllClasses();
    }
    setShowClearConfirm(false);
    setSelectedImage(null);
  };

  // Training Logic
  const trainModel = async () => {
    if (classes.length < 2 || !classes.every(c => c.images.length >= 10)) {
      setError("Bitte sammle für alle Klassen mindestens 10 Bilder.");
      return;
    }
    
    const hasInvalidNames = classes.some(c => c.name.trim() === '');
    const hasDuplicateNames = new Set(classes.map(c => c.name.trim())).size !== classes.length;
    
    if (hasInvalidNames) {
      setError("Bitte gib allen Klassen einen Namen.");
      return;
    }
    
    if (hasDuplicateNames) {
      setError("Bitte gib allen Klassen einen eindeutigen Namen.");
      return;
    }
    
    setIsTraining(true);
    
    if (classifier) {
      classifier.dispose();
    }
    
    const newClassifier = knnClassifier.create();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      for (const cls of classes) {
        for (const img of cls.images) {
          const tensor = tf.tensor1d(img.featureArray);
          newClassifier.addExample(tensor, cls.id);
          tensor.dispose();
        }
      }
      
      setClassifier(newClassifier);
      setHasTrainedModel(true);
      setIsTraining(false);
    } catch (err) {
      console.error("Training error:", err);
      setError("Fehler beim Training des Modells.");
      setIsTraining(false);
    }
  };

  const hasInvalidNames = classes.some(c => c.name.trim() === '');
  const hasDuplicateNames = new Set(classes.map(c => c.name.trim())).size !== classes.length;
  const canTrain = classes.length >= 2 && classes.every(c => c.images.length >= 10) && !hasInvalidNames && !hasDuplicateNames;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-zinc-600 hover:text-zinc-900 transition-colors font-medium text-sm flex-shrink-0"
            aria-label="Zurück zur Startseite"
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">Zurück</span>
          </button>
          
          <div className="flex-1 flex items-center justify-center gap-3 px-2">
            <img 
              src="/ada-logo.png" 
              alt="Ada Lovelace Projekt Logo" 
              className="h-8 w-auto object-contain hidden lg:block"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-base sm:text-lg font-bold text-zinc-800 line-clamp-1">Modell trainieren</h1>
          </div>

          <button 
            onClick={toggleCamera}
            className="p-2 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-full transition-colors flex-shrink-0"
            title="Kamera wechseln"
            aria-label="Kamera wechseln"
          >
            <SwitchCamera className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 lg:px-8">
          <div role="alert" aria-live="assertive" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start text-sm">
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Classes */}
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
                <RotateCcw className="w-4 h-4 sm:mr-2" aria-hidden="true" /> <span className="hidden sm:inline">Zurücksetzen</span>
              </button>
              <button
                onClick={addClass}
                className="flex items-center px-3 sm:px-4 py-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl text-sm font-medium transition-colors shadow-sm"
                aria-label="Neue Klasse hinzufügen"
              >
                <Plus className="w-4 h-4 sm:mr-2" aria-hidden="true" /> <span className="hidden sm:inline">Hinzufügen</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {classes.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-2xl border border-zinc-200 border-dashed">
                <p className="text-zinc-600 text-sm">Keine Klassen vorhanden. Füge Klassen hinzu, um zu starten.</p>
              </div>
            ) : (
              classes.map((cls) => (
                <ClassCard 
                  key={cls.id}
                  cls={cls}
                  allClasses={classes}
                  stream={streamState}
                  facingMode={facingMode}
                  onAddExample={(video) => addExample(cls.id, video)}
                  onAddImageExample={(img) => addImageExample(cls.id, img)}
                  onRemove={() => setClassToRemove(cls.id)}
                  onClear={() => setClassToClear(cls.id)}
                  onRemoveImages={(ids) => removeImages(cls.id, ids)}
                  onUpdateName={(name) => updateClassName(cls.id, name)}
                  onImageClick={(img) => setSelectedImage({classId: cls.id, image: img})}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column: Training & Prediction */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
          
          {/* Training Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/80 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-800 flex items-center">
                <Brain className="w-4 h-4 mr-2 text-indigo-500" /> 2. Training
              </h2>
              {hasTrainedModel && (
                <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Bereit
                </span>
              )}
            </div>
            <div className="p-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-600">Klassen bereit:</span>
                <span className={cn("font-semibold", canTrain ? "text-emerald-700" : "text-red-600")}>
                  {classes.filter(c => c.images.length >= 10).length} / {Math.max(2, classes.length)}
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
                className={cn(
                  "w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                  isTraining || !canTrain
                    ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5"
                )}
              >
                {isTraining ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Trainiere...</>
                ) : hasTrainedModel ? (
                  "Modell neu trainieren"
                ) : (
                  "Modell trainieren"
                )}
              </button>
              
              <p className="text-xs text-zinc-600 mt-3 text-center" aria-live="polite">
                {isTraining
                  ? "Bitte warten, das Modell wird trainiert..."
                  : hasInvalidNames
                  ? "Bitte gib allen Klassen einen Namen."
                  : hasDuplicateNames
                  ? "Bitte gib allen Klassen einen eindeutigen Namen."
                  : !canTrain
                  ? "Sammle mind. 10 Bilder in ALLEN Klassen (mind. 2)."
                  : hasTrainedModel
                  ? "Modell ist bereit. Du kannst es jederzeit neu trainieren."
                  : "Genug Bilder gesammelt! Du kannst das Modell jetzt trainieren."}
              </p>
            </div>
          </div>

          {/* Prediction Card */}
          <div className={cn(
            "bg-white rounded-2xl shadow-sm border border-zinc-200/80 overflow-hidden flex flex-col flex-1 transition-opacity duration-300",
            !hasTrainedModel ? "opacity-80 pointer-events-none" : "opacity-100"
          )}>
            <div className="px-5 py-4 border-b border-zinc-100 flex justify-between items-center">
              <h2 className="text-base font-bold text-zinc-800 flex items-center">
                <Camera className="w-4 h-4 mr-2 text-indigo-500" /> 3. Vorhersage
              </h2>
              {isPredicting && (
                <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
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
                  className={cn(
                    "w-full h-full object-cover rounded-xl",
                    facingMode === 'user' ? "transform scale-x-[-1]" : ""
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

              {/* Prediction Results */}
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
                                style={{ 
                                  width: `${conf * 100}%`,
                                  backgroundColor: c.color
                                }}
                              />
                            </div>
                            <span className="w-10 text-right font-mono font-medium text-zinc-600">{Math.round(conf * 100)}%</span>
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
        
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          ref={selectedImageRef}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-zinc-900/80 backdrop-blur-sm overflow-y-auto overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="image-modal-title"
        >
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-fit max-w-sm w-full">
            <div className="p-4 border-b border-zinc-100 flex justify-between items-center">
              <h3 id="image-modal-title" className="font-bold text-zinc-800 text-sm">Bild Vorschau</h3>
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
                aria-label="Schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <img 
                src={selectedImage.image.dataUrl} 
                alt="Vergrößerte Bildvorschau" 
                className="w-48 h-48 object-cover rounded-2xl shadow-sm border border-zinc-200 mb-6"
              />
              <button
                onClick={() => removeImage(selectedImage.classId, selectedImage.image.id)}
                className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" /> Bild löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirm Modal */}
      {showClearConfirm && (
        <div 
          ref={showClearConfirmRef}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-zinc-900/80 backdrop-blur-sm overflow-y-auto overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-modal-title"
          aria-describedby="clear-modal-desc"
        >
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-fit max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4" aria-hidden="true">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 id="clear-modal-title" className="text-xl font-bold text-zinc-900 mb-2">Daten unwiderruflich löschen?</h3>
              <p id="clear-modal-desc" className="text-zinc-600 mb-6">
                Möchten Sie wirklich alle erfassten Klassen und Bilddaten löschen? Das aktuell trainierte Modell wird dabei unwiderruflich entfernt und der Vorgang kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={clearAll}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Unwiderruflich löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Clear Confirm Modal */}
      {classToClear && (
        <div 
          ref={classToClearRef}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-zinc-900/80 backdrop-blur-sm overflow-y-auto overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="class-clear-modal-title"
          aria-describedby="class-clear-modal-description"
        >
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-fit max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 id="class-clear-modal-title" className="text-xl font-bold text-zinc-900 mb-2">Bilder dieser Klasse löschen?</h3>
            <p id="class-clear-modal-description" className="text-zinc-600 mb-6 text-sm">
              Möchten Sie wirklich alle Bilder der Klasse <strong>"{classes.find(c => c.id === classToClear)?.name}"</strong> unwiderruflich löschen?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setClassToClear(null)}
                className="flex-1 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  const id = classToClear;
                  if (!id) {
                    return;
                  }
                  clearClass(id);
                  setClassToClear(null);
                }}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Zurücksetzen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Remove Confirm Modal */}
      {classToRemove && (
        <div 
          ref={classToRemoveRef}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-zinc-900/80 backdrop-blur-sm overflow-y-auto overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="class-remove-modal-title"
          aria-describedby="class-remove-modal-description"
        >
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-fit max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 id="class-remove-modal-title" className="text-xl font-bold text-zinc-900 mb-2">Klasse löschen?</h3>
            <p id="class-remove-modal-description" className="text-zinc-600 mb-6 text-sm">
              Möchten Sie die Klasse <strong>"{classes.find(c => c.id === classToRemove)?.name}"</strong> und alle zugehörigen Bilder wirklich entfernen?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setClassToRemove(null)}
                className="flex-1 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  const id = classToRemove;
                  if (!id) return;
                  removeClass(id);
                  setClassToRemove(null);
                }}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consent Modal */}
      {!hasConsented && (
        <div 
          ref={hasConsentedRef}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-zinc-900/80 backdrop-blur-sm overflow-y-auto overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-modal-title"
        >
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-fit max-w-lg w-full p-8">
            <h2 id="consent-modal-title" className="text-2xl font-bold text-zinc-900 mb-6">Einwilligung zur Datenverarbeitung</h2>
            
            <div className="space-y-5 mb-8">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyChecked}
                  onChange={(e) => setPrivacyChecked(e.target.checked)}
                  className="mt-1 w-5 h-5 flex-shrink-0 rounded border-zinc-300 text-indigo-600 focus:outline-none focus:ring-0 focus-visible:ring-indigo-500"
                />

                <span className="text-zinc-700 text-sm leading-relaxed">
                  Ich habe die <a href="/datenschutz" target="_blank" className="text-indigo-600 hover:underline font-medium">Datenschutzerklärung</a> zur Kenntnis genommen und stimme der Verarbeitung meiner Daten gemäß den dort beschriebenen Bedingungen zu.
                </span>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modelChecked}
                  onChange={(e) => setModelChecked(e.target.checked)}
                  className="mt-1 w-5 h-5 flex-shrink-0 rounded border-zinc-300 text-indigo-600 focus:outline-none focus:ring-0 focus-visible:ring-indigo-500"
                />

                <span className="text-zinc-700 text-sm leading-relaxed">
                  Ich willige ein, dass für die Ausführung der Anwendung notwendige KI-Modelle (MobileNet) von Google-Servern geladen werden. Mir ist bewusst, dass hierbei meine IP-Adresse an Google übertragen wird (siehe <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">Google Datenschutzerklärung</a>). Die Verarbeitung der aufgenommenen Bilddaten erfolgt dabei ausschließlich lokal auf meinem Endgerät; es findet kein Upload von Bildmaterial statt.
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => setHasConsented(true)}
                disabled={!privacyChecked || !modelChecked}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors"
              >
                Zustimmen<span className="hidden sm:inline"> & Fortfahren</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal */}
      {hasConsented && isModelLoading && (
        <div 
          ref={isModelLoadingRef}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-zinc-900/80 backdrop-blur-sm overflow-y-auto overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="loading-modal-title"
        >
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-fit max-w-sm w-full p-8 flex flex-col items-center text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" aria-hidden="true" />
            <h2 id="loading-modal-title" className="text-xl font-bold text-zinc-900 mb-2">Lade KI-Modelle...</h2>
            <p className="text-zinc-600 text-sm" aria-live="polite">{loadingText}</p>
          </div>
        </div>
      )}

      {/* Camera Consent Modal */}
      {hasConsented && !isModelLoading && !cameraConsent && (
        <div 
          ref={cameraConsentRef}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-zinc-900/80 backdrop-blur-sm overflow-y-auto overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="camera-modal-title"
        >
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-fit max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6" aria-hidden="true">
              <Camera className="w-8 h-8" />
            </div>
            <h2 id="camera-modal-title" className="text-2xl font-bold text-zinc-900 mb-4">Berechtigung zur Kameranutzung</h2>
            <p className="text-zinc-600 mb-8 text-sm leading-relaxed">
              Für die Erfassung von Trainingsdaten benötigt diese Anwendung Zugriff auf die Kamera Ihres Endgeräts. 
              <strong> Die erfassten Bilddaten werden ausschließlich lokal im Browser verarbeitet und zu keinem Zeitpunkt an externe Server übermittelt oder dort gespeichert.</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => setCameraConsent(true)}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center"
              >
                <Camera className="w-5 h-5 mr-2" /> Erlauben
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ClassCardProps {
  cls: MLClass; 
  allClasses: MLClass[];
  stream: MediaStream | null;
  facingMode: 'user' | 'environment';
  onAddExample: (video: HTMLVideoElement) => void;
  onAddImageExample: (img: HTMLImageElement) => void;
  onRemove: () => void;
  onClear: () => void;
  onRemoveImages: (ids: string[]) => void;
  onUpdateName: (name: string) => void;
  onImageClick: (img: MLImage) => void;
}

function ClassCard({ 
  cls, 
  allClasses,
  stream,
  facingMode,
  onAddExample, 
  onAddImageExample,
  onRemove, 
  onClear,
  onRemoveImages,
  onUpdateName,
  onImageClick
}: ClassCardProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const recordIntervalRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Attach stream to local video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startRecording = (e?: React.SyntheticEvent) => {
    if (!videoRef.current) return;
    if (isRecording) return; // Prevent double firing from touch + mouse events
    
    setIsRecording(true);
    
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
    }
    
    onAddExample(videoRef.current);
    
    recordIntervalRef.current = window.setInterval(() => {
      if (videoRef.current) {
        onAddExample(videoRef.current);
      }
    }, 100);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
      }
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          onAddImageExample(img);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const nameTrimmed = cls.name.trim();
  const isEmpty = nameTrimmed === '';
  const isDuplicate = allClasses.filter(c => c.name.trim() === nameTrimmed).length > 1;
  const errorMsg = isEmpty ? "Name darf nicht leer sein" : isDuplicate ? "Name muss eindeutig sein" : null;

  const toggleImageSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    onRemoveImages(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const handleClear = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    onClear();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/80 overflow-hidden flex flex-col transition-all hover:shadow-md">
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 flex justify-between items-start sm:items-center bg-zinc-50/50">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: cls.color }} aria-hidden="true" />
            <input
              type="text"
              value={cls.name}
              onChange={(e) => onUpdateName(e.target.value)}
              className={cn(
                "font-semibold bg-transparent border-b border-transparent focus:ring-0 focus:ring-offset-0 p-0 w-[120px] sm:w-[160px] text-sm transition-colors",
                errorMsg ? "border-red-500 text-red-600" : "text-zinc-800 focus:border-zinc-400"
              )}
              onPointerDown={(e) => { e.currentTarget.dataset.mouseFocused = '1'; }}
              onBlur={(e) => { delete e.currentTarget.dataset.mouseFocused; }}
              placeholder="Klassenname"
              aria-label={`Name für Klasse ${cls.name || 'ohne Namen'}`}
              aria-invalid={!!errorMsg}
              aria-errormessage={errorMsg ? `error-${cls.id}` : undefined}
            />
          </div>
          {errorMsg && <span id={`error-${cls.id}`} className="text-[10px] text-red-500 mt-1 ml-[22px]">{errorMsg}</span>}
        </div>
        <div className="flex items-center gap-3 mt-1 sm:mt-0 flex-shrink-0">
          <span className="text-xs font-mono text-zinc-600 bg-zinc-100 px-2 py-1 rounded-md whitespace-nowrap flex-shrink-0">
            {cls.images.length} Bilder
          </span>
          <button 
            onClick={handleClear}
            className="text-zinc-400 hover:text-indigo-500 transition-colors"
            title="Bilder dieser Klasse zurücksetzen"
            aria-label={`Bilder der Klasse ${cls.name || 'ohne Namen'} zurücksetzen`}
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
          </button>
          <button 
            onClick={onRemove}
            className="text-zinc-400 hover:text-red-500 transition-colors"
            title="Klasse löschen"
            aria-label={`Klasse ${cls.name || 'ohne Namen'} löschen`}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col sm:flex-row gap-4">
        
        {/* Left: Camera & Controls */}
        <div className="w-full sm:w-56 flex flex-col gap-3 flex-shrink-0">
          <div className="relative aspect-[4/3] bg-zinc-900 rounded-xl overflow-hidden shadow-inner">
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              className={cn(
                "w-full h-full object-cover",
                facingMode === 'user' ? "transform scale-x-[-1]" : ""
              )}
            />
          </div>
          <div className="flex gap-2">
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              onTouchCancel={stopRecording}
              onContextMenu={(e) => e.preventDefault()}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  startRecording();
                }
              }}
              onKeyUp={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  stopRecording();
                }
              }}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center select-none touch-none",
                isRecording 
                  ? "scale-95 shadow-inner opacity-90" 
                  : "shadow-sm hover:-translate-y-0.5 hover:shadow-md"
              )}
              style={{
                backgroundColor: cls.color,
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none'
              }}
            >
              <Camera className={cn("w-4 h-4 mr-2", isRecording && "animate-pulse")} />
              {isRecording ? "Aufnahme..." : "Aufnehmen"}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl transition-colors flex items-center justify-center shadow-sm"
              title="Bilder hochladen"
              aria-label="Bilder hochladen"
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              multiple
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>
        </div>

        {/* Right: Thumbnails */}
        <div className="flex-1 relative min-h-[160px] sm:min-h-0 flex flex-col">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
              {isSelectionMode ? `${selectedIds.size} ausgewählt` : 'Gesammelte Bilder'}
            </span>
            <div className="flex gap-2">
              {isSelectionMode ? (
                <>
                  <button
                    onClick={handleBulkDelete}
                    disabled={selectedIds.size === 0}
                    className="text-[10px] font-bold transition-opacity hover:opacity-70 disabled:text-zinc-300 disabled:opacity-50"
                    style={{ color: selectedIds.size > 0 ? cls.color : undefined }}
                  >
                    Löschen
                  </button>
                  <button
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedIds(new Set());
                    }}
                    className="text-[10px] font-bold text-zinc-600 hover:text-zinc-700 transition-colors"
                  >
                    Abbrechen
                  </button>
                </>
              ) : (
                cls.images.length > 0 && (
                  <button
                    onClick={() => setIsSelectionMode(true)}
                    className="text-[10px] font-bold transition-opacity hover:opacity-70"
                    style={{ color: cls.color }}
                  >
                    Auswählen
                  </button>
                )
              )}
            </div>
          </div>
          <div className="flex-1 relative h-[190px] max-h-[190px] bg-zinc-50/50 rounded-xl border border-zinc-100 p-2 overflow-y-auto">
            {cls.images.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {cls.images.map((img) => (
                  <button 
                    key={img.id} 
                    type="button"
                    aria-label={isSelectionMode ? (selectedIds.has(img.id) ? "Bild abwählen" : "Bild auswählen") : "Bild vergrößern"}
                    className={cn(
                      "aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all relative block w-full h-full p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500",
                      isSelectionMode 
                        ? selectedIds.has(img.id) 
                          ? "ring-2" 
                          : "border-zinc-200 opacity-60 hover:opacity-100"
                        : "border-zinc-200 hover:shadow-sm"
                    )}
                    style={{ 
                      borderColor: (isSelectionMode && selectedIds.has(img.id)) ? cls.color : undefined,
                      boxShadow: (isSelectionMode && selectedIds.has(img.id)) ? `0 0 0 2px ${cls.color}33` : undefined 
                    }}
                    onClick={() => isSelectionMode ? toggleImageSelection(img.id) : onImageClick(img)}
                  >
                    <img src={img.dataUrl} alt="Training sample" className="w-full h-full object-cover" />
                    {isSelectionMode && (
                      <div 
                        className={cn(
                          "absolute top-1 right-1 w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                          selectedIds.has(img.id) ? "text-white" : "bg-white/80 border-zinc-300"
                        )}
                        style={{ 
                          backgroundColor: selectedIds.has(img.id) ? cls.color : undefined,
                          borderColor: selectedIds.has(img.id) ? cls.color : undefined
                        }}
                      >
                        {selectedIds.has(img.id) && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 text-zinc-600">
                <ImageIcon className="w-6 h-6 mb-2 opacity-20" />
                <p className="text-xs">
                  Halte "Aufnehmen" gedrückt, um Bilder zu sammeln.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

