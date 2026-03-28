/**
 * Camera preview with recording and upload controls for a single ML class.
 */
import type React from 'react';
import { useEffect, useRef } from 'react';
import { Camera, Upload } from 'lucide-react';
import { cn } from '../lib/utils';

export interface CameraPreviewProps {
  stream: MediaStream | null;
  facingMode: 'user' | 'environment';
  color: string;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

/** Renders a camera feed with hold-to-record and file-upload controls for a single class. */
export default function CameraPreview({
  stream,
  facingMode,
  color,
  isRecording,
  onStartRecording,
  onStopRecording,
  onFileUpload,
  videoRef,
}: CameraPreviewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const keyboardRecordingRef = useRef(false);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    if (stream) {
      videoElement.srcObject = stream;
    } else {
      videoElement.srcObject = null;
    }

    return () => {
      if (videoElement.srcObject === stream) {
        videoElement.srcObject = null;
      }
    };
  }, [stream, videoRef]);

  return (
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
            onStartRecording();
          }}
          onMouseUp={onStopRecording}
          onMouseLeave={onStopRecording}
          onTouchStart={() => {
            keyboardRecordingRef.current = false;
            onStartRecording();
          }}
          onTouchEnd={onStopRecording}
          onTouchCancel={onStopRecording}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              if (!isRecording) {
                keyboardRecordingRef.current = true;
                onStartRecording();
              } else if (keyboardRecordingRef.current) {
                keyboardRecordingRef.current = false;
                onStopRecording();
              }
            }
          }}
          onKeyUp={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          className={cn(
            'flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center select-none touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2',
            isRecording
              ? 'scale-95 shadow-inner opacity-90'
              : 'shadow-sm hover:-translate-y-0.5 hover:shadow-md'
          )}
          style={{
            backgroundColor: color,
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
          }}
        >
          <Camera
            className={cn('w-4 h-4 mr-2', isRecording && 'animate-pulse')}
            aria-hidden="true"
          />
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
          onChange={onFileUpload}
          accept="image/*"
          multiple
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
