/**
 * CameraPreview.tsx
 *
 * Live camera feed with hold-to-record and file-upload controls for a single ML training class.
 * Supports mouse, touch, and keyboard (Space/Enter) interaction for capturing training images.
 */
import type React from 'react';
import { useEffect, useRef } from 'react';
import { Camera, Upload } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * Props for the CameraPreview component.
 */
export interface CameraPreviewProps {
  /** The active WebRTC camera stream, or null when no camera is available. */
  stream: MediaStream | null;
  /** Camera facing direction — 'user' for front camera (mirrored), 'environment' for back camera. */
  facingMode: 'user' | 'environment';
  /** Accent color applied to the record button, matching the parent ML class color. */
  color: string;
  /** Whether recording is currently active (images are being captured). */
  isRecording: boolean;
  /** Called when the user begins holding the record button. */
  onStartRecording: () => void;
  /** Called when the user releases the record button. */
  onStopRecording: () => void;
  /** Called when the user selects image files via the file input. */
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Ref to the underlying video element, shared with the parent for feature extraction. */
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

/**
 * Renders a live camera feed alongside hold-to-record and file-upload controls
 * for capturing training images for a single ML class.
 *
 * Recording works as a hold gesture: press and hold to record, release to stop.
 * Keyboard users (Space/Enter) get a toggle instead — press once to start, press again to stop.
 */
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
  // Tracks whether the current recording session was started via keyboard,
  // so Space/Enter acts as a toggle rather than requiring hold-and-release.
  const keyboardRecordingRef = useRef(false);

  // Assign or clear the camera stream on the video element whenever the stream changes.
  // The cleanup only nulls srcObject if it still points to the same stream,
  // preventing a race condition when the stream is swapped while unmounting.
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
