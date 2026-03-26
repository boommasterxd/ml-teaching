import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, Trash2, RotateCcw, Upload, Image as ImageIcon, CheckCircle2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { MLClass, MLImage } from '../types/ml';

export interface ClassCardProps {
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

export default function ClassCard({
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
  onImageClick,
}: ClassCardProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const recordIntervalRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const keyboardRecordingRef = useRef(false);

  // Kamera-Stream an lokales Video-Element anhängen
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startRecording = () => {
    if (!videoRef.current) return;
    if (isRecording) return; // Verhindert Doppel-Auslösung bei Touch + Mouse

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
        const result = event.target?.result;
        if (typeof result !== 'string') return;
        const img = new Image();
        img.onload = () => {
          onAddImageExample(img);
        };
        img.src = result;
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
  const errorMsg = isEmpty ? 'Name darf nicht leer sein' : isDuplicate ? 'Name muss eindeutig sein' : null;

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
              autoComplete="off"
              value={cls.name}
              onChange={(e) => onUpdateName(e.target.value)}
              className={cn(
                'font-semibold bg-transparent border-b border-transparent focus:ring-0 focus:ring-offset-0 p-0 w-[120px] sm:w-[160px] text-sm transition-colors',
                errorMsg ? 'border-red-500 text-red-600' : 'text-zinc-800 focus:border-zinc-400'
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
            onClick={handleClear}
            className="p-1.5 rounded-md text-zinc-400 hover:text-indigo-500 transition-colors"
            title="Bilder dieser Klasse zurücksetzen"
            aria-label={`Bilder der Klasse ${cls.name || 'ohne Namen'} zurücksetzen`}
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 transition-colors"
            title="Klasse löschen"
            aria-label={`Klasse ${cls.name || 'ohne Namen'} löschen`}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col sm:flex-row gap-4">

        {/* Links: Kamera & Steuerung */}
        <div className="w-full sm:w-56 flex flex-col gap-3 flex-shrink-0">
          <div className="relative aspect-[4/3] bg-zinc-900 rounded-xl overflow-hidden shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              aria-label="Kameravorschau für Trainingsaufnahme"
              className={cn(
                'w-full h-full object-cover',
                facingMode === 'user' ? 'transform scale-x-[-1]' : ''
              )}
            />
          </div>
          <div className="flex gap-2">
            <button
              onMouseDown={() => {
                keyboardRecordingRef.current = false;
                startRecording();
              }}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={() => {
                keyboardRecordingRef.current = false;
                startRecording();
              }}
              onTouchEnd={stopRecording}
              onTouchCancel={stopRecording}
              onContextMenu={(e) => e.preventDefault()}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  if (!isRecording) {
                    keyboardRecordingRef.current = true;
                    startRecording();
                  } else if (keyboardRecordingRef.current) {
                    keyboardRecordingRef.current = false;
                    stopRecording();
                  }
                }
              }}
              onKeyUp={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  // Tastatur nutzt Toggle-Modus via onKeyDown — kein stopRecording hier
                }
              }}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center select-none touch-none',
                isRecording
                  ? 'scale-95 shadow-inner opacity-90'
                  : 'shadow-sm hover:-translate-y-0.5 hover:shadow-md'
              )}
              style={{
                backgroundColor: cls.color,
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
              }}
            >
              <Camera className={cn('w-4 h-4 mr-2', isRecording && 'animate-pulse')} />
              {isRecording ? 'Aufnahme...' : 'Aufnehmen'}
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

        {/* Rechts: Thumbnails */}
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
          <div className="flex-1 relative h-[190px] max-h-[190px] bg-zinc-50/50 rounded-xl border border-zinc-200 p-2 overflow-y-auto">
            {cls.images.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {cls.images.map((img, imgIndex) => (
                  <button
                    key={img.id}
                    type="button"
                    aria-label={
                      isSelectionMode
                        ? selectedIds.has(img.id) ? 'Bild abwählen' : 'Bild auswählen'
                        : 'Bild vergrößern'
                    }
                    className={cn(
                      'aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all relative block w-full h-full p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500',
                      isSelectionMode
                        ? selectedIds.has(img.id)
                          ? 'ring-2'
                          : 'border-zinc-200 opacity-60 hover:opacity-100'
                        : 'border-zinc-200 hover:shadow-sm'
                    )}
                    style={{
                      borderColor: (isSelectionMode && selectedIds.has(img.id)) ? cls.color : undefined,
                      boxShadow: (isSelectionMode && selectedIds.has(img.id)) ? `0 0 0 2px ${cls.color}33` : undefined,
                    }}
                    onClick={() => isSelectionMode ? toggleImageSelection(img.id) : onImageClick(img)}
                  >
                    <img src={img.dataUrl} alt={`Trainingsbeispiel ${imgIndex + 1}`} className="w-full h-full object-cover" />
                    {isSelectionMode && (
                      <div
                        className={cn(
                          'absolute top-1 right-1 w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
                          selectedIds.has(img.id) ? 'text-white' : 'bg-white/80 border-zinc-300'
                        )}
                        style={{
                          backgroundColor: selectedIds.has(img.id) ? cls.color : undefined,
                          borderColor: selectedIds.has(img.id) ? cls.color : undefined,
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
                <p className="text-xs">Halte "Aufnehmen" gedrückt, um Bilder zu sammeln.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
