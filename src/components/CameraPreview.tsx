import type React from 'react';
import { useEffect, useRef } from 'react';
import { Camera, Upload } from './icons';
import Button from './Button';
import { cn } from '../lib/utils';
import { IMAGE_INPUT_ACCEPT } from '../lib/image-input-policy';
import { classColorClasses } from '../lib/class-colors';

export interface CameraPreviewProps {
  disabled: boolean;
  stream: MediaStream | null;
  facingMode: 'user' | 'environment';
  color: string;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

type RecordButtonProps = Pick<
  CameraPreviewProps,
  'color' | 'isRecording' | 'onStartRecording' | 'onStopRecording' | 'disabled'
>;

function RecordButton({
  disabled,
  color,
  isRecording,
  onStartRecording,
  onStopRecording,
}: RecordButtonProps) {
  const keyboardRecording = useRef(false);
  const stopPointerRecording = () => {
    if (!keyboardRecording.current) onStopRecording();
  };
  return (
    <Button
      variant="capture"
      disabled={disabled}
      className={cn(
        'flex-1 py-2.5 touch-none select-none [-webkit-touch-callout:none]',
        classColorClasses(color),
      )}
      aria-pressed={isRecording}
      onPointerDown={(event) => {
        // Motion's Enter feedback dispatches pointer events without a pointer device.
        if (!event.pointerType) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        keyboardRecording.current = false;
        onStartRecording();
      }}
      onPointerUp={stopPointerRecording}
      onPointerCancel={stopPointerRecording}
      onLostPointerCapture={stopPointerRecording}
      onContextMenu={(event) => event.preventDefault()}
      onBlur={() => {
        keyboardRecording.current = false;
        onStopRecording();
      }}
      onKeyDown={(event) => {
        if (event.key !== ' ' && event.key !== 'Enter') return;
        event.preventDefault();
        if (event.repeat) return;
        if (!isRecording) {
          keyboardRecording.current = true;
          onStartRecording();
        } else if (keyboardRecording.current) {
          keyboardRecording.current = false;
          onStopRecording();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === ' ' || event.key === 'Enter') event.preventDefault();
      }}
    >
      <Camera data-icon="inline-start" animate={isRecording} loop aria-hidden="true" />
      {isRecording ? 'Aufnahme...' : 'Aufnehmen'}
    </Button>
  );
}

/** Hold with pointer or toggle with keyboard; camera attachment is browser-effect only. */
export default function CameraPreview(props: CameraPreviewProps) {
  const {
    stream,
    facingMode,
    color,
    isRecording,
    onStartRecording,
    onStopRecording,
    onFileUpload,
    videoRef,
    disabled,
  } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    return () => {
      if (video.srcObject === stream) video.srcObject = null;
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
            facingMode === 'user' && 'transform scale-x-[-1]',
          )}
        />
      </div>
      <div className="flex gap-2">
        <RecordButton
          disabled={disabled}
          color={color}
          isRecording={isRecording}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          title="Bilder hochladen"
          disabled={disabled}
          aria-label="Bilder hochladen"
        >
          <Upload data-icon="inline-start" aria-hidden="true" />
        </Button>
        <input
          type="file"
          disabled={disabled}
          ref={fileInputRef}
          onChange={onFileUpload}
          accept={IMAGE_INPUT_ACCEPT}
          multiple
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
