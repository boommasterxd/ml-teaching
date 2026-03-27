/**
 * Card component representing a single ML class.
 * Orchestrates camera recording, image upload, and thumbnail gallery via subcomponents.
 */
import type React from 'react';
import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { CAMERA } from '../constants';
import type { MLClass, MLImage } from '../types/ml';
import CameraPreview from './CameraPreview';
import ImageGallery from './ImageGallery';

export interface ClassCardProps {
  cls: MLClass;
  isDuplicate: boolean;
  stream: MediaStream | null;
  facingMode: 'user' | 'environment';
  onAddExample: (classId: string, video: HTMLVideoElement) => void;
  onAddImageExample: (classId: string, img: HTMLImageElement) => void;
  onRemove: (classId: string) => void;
  onClear: (classId: string) => void;
  onRemoveImages: (classId: string, ids: string[]) => void;
  onUpdateName: (classId: string, name: string) => void;
  onImageClick: (classId: string, img: MLImage) => void;
}

/** Displays a class with its camera preview, recording controls, and image gallery. */
const ClassCard = memo(function ClassCard({
  cls,
  isDuplicate,
  stream,
  facingMode,
  onAddExample,
  onAddImageExample,
  onRemove,
  onClear,
  onRemoveImages,
  onUpdateName,
  onImageClick,
}: ClassCardProps) {
  const [isRecording, setIsRecording] = useState(false);
  const recordIntervalRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /** Begins continuous frame capture at a fixed interval. */
  const startRecording = () => {
    if (!videoRef.current || isRecording) return;
    setIsRecording(true);

    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
    }

    onAddExample(cls.id, videoRef.current);

    recordIntervalRef.current = window.setInterval(() => {
      if (videoRef.current) {
        onAddExample(cls.id, videoRef.current);
      }
    }, CAMERA.CAPTURE_INTERVAL_MS);
  };

  /** Stops continuous frame capture. */
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

  /** Reads uploaded image files and passes each to the feature extractor. */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result !== 'string') return;
        const img = new Image();
        img.onload = () => {
          onAddImageExample(cls.id, img);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    });

    if (e.target) {
      e.target.value = '';
    }
  };

  const handleImageClick = useCallback((img: MLImage) => {
    onImageClick(cls.id, img);
  }, [onImageClick, cls.id]);

  const handleRemoveImages = useCallback((ids: string[]) => {
    onRemoveImages(cls.id, ids);
  }, [onRemoveImages, cls.id]);

  const isEmpty = cls.name.trim() === '';
  const errorMsg = isEmpty ? 'Name darf nicht leer sein' : isDuplicate ? 'Name muss eindeutig sein' : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/80 overflow-hidden flex flex-col transition-all hover:shadow-md">

      {/* Card header: class name, image count, clear & delete buttons */}
      <div className="px-4 py-3 border-b border-zinc-100 flex justify-between items-start sm:items-center bg-zinc-50/50">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: cls.color }} aria-hidden="true" />
            <input
              type="text"
              autoComplete="off"
              value={cls.name}
              onChange={(e) => onUpdateName(cls.id, e.target.value)}
              className={cn(
                'font-semibold bg-transparent border-b border-transparent focus:ring-0 focus:ring-offset-0 p-0 w-[120px] sm:w-[160px] text-sm transition-colors',
                errorMsg ? 'border-red-500 text-red-600' : 'text-zinc-800 focus:border-zinc-500'
              )}
              onPointerDown={(e) => { e.currentTarget.dataset.mouseFocused = '1'; }}
              onBlur={(e) => { delete e.currentTarget.dataset.mouseFocused; }}
              placeholder="Klassenname"
              aria-label={`Name für Klasse ${cls.name || 'ohne Namen'}`}
              aria-invalid={!!errorMsg}
              aria-errormessage={errorMsg ? `error-${cls.id}` : undefined}
            />
          </div>
          {errorMsg && (
            <span id={`error-${cls.id}`} className="text-[10px] text-red-500 mt-1 ml-[22px]">
              {errorMsg}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 sm:mt-0 flex-shrink-0">
          <span className="text-xs font-mono text-zinc-600 bg-zinc-100 px-2 py-1 rounded-md whitespace-nowrap flex-shrink-0">
            {cls.images.length} Bilder
          </span>
          <button
            onClick={() => onClear(cls.id)}
            className="p-2 rounded-md text-zinc-500 hover:text-indigo-500 transition-colors"
            title="Bilder dieser Klasse zurücksetzen"
            aria-label={`Bilder der Klasse ${cls.name || 'ohne Namen'} zurücksetzen`}
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => onRemove(cls.id)}
            className="p-2 rounded-md text-zinc-500 hover:text-red-500 transition-colors"
            title="Klasse löschen"
            aria-label={`Klasse ${cls.name || 'ohne Namen'} löschen`}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col sm:flex-row gap-4">
        <CameraPreview
          stream={stream}
          facingMode={facingMode}
          color={cls.color}
          isRecording={isRecording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onFileUpload={handleFileUpload}
          videoRef={videoRef}
        />

        <ImageGallery
          images={cls.images}
          color={cls.color}
          onImageClick={handleImageClick}
          onRemoveImages={handleRemoveImages}
        />
      </div>
    </div>
  );
});

export default ClassCard;
