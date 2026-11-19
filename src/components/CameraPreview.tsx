import type React from 'react';
import { useEffect, useEffectEvent, useId, useRef } from 'react';
import { Camera } from './icons/camera';
import { Upload } from './icons/upload';
import Button from './Button';
import { Input } from './ui/input';
import { cn } from '../lib/utils';
import { IMAGE_INPUT_ACCEPT } from '../lib/image-input-policy';

export interface CameraPreviewProps {
  disabled: boolean;
  stream: MediaStream | null;
  facingMode: 'user' | 'environment';
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  fileActions?: React.ReactNode;
  onCaptureIntent?: () => void;
}

type RecordButtonProps = Pick<
  CameraPreviewProps,
  'isRecording' | 'onStartRecording' | 'onStopRecording' | 'disabled' | 'onCaptureIntent'
> & { hintId: string };

function RecordButton({
  disabled,
  hintId,
  isRecording,
  onStartRecording,
  onStopRecording,
  onCaptureIntent,
}: RecordButtonProps) {
  const keyboardRecording = useRef(false);
  const stopPointerRecording = () => {
    if (!keyboardRecording.current) onStopRecording();
  };
  return (
    <Button
      variant={isRecording ? 'destructive' : 'default'}
      size="lg"
      disabled={disabled}
      className="touch-none select-none [-webkit-touch-callout:none]"
      aria-pressed={isRecording}
      aria-describedby={hintId}
      onPointerEnter={onCaptureIntent}
      onFocus={onCaptureIntent}
      onPointerDown={(event) => {
        // Motion's Enter feedback dispatches pointer events without a pointer device.
        if (!event.pointerType) return;
        onCaptureIntent?.();
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
          onCaptureIntent?.();
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
    isRecording,
    onStartRecording,
    onStopRecording,
    onFileUpload,
    videoRef,
    disabled,
    fileActions,
    onCaptureIntent,
  } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const endCapture = useEffectEvent(onStopRecording);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    return () => {
      if (video.srcObject === stream) video.srcObject = null;
      endCapture();
    };
  }, [stream, videoRef]);
  return (
    <>
      <div
        className={cn(
          'col-span-full',
          fileActions &&
            'grid grid-cols-[minmax(0,2.4fr)_repeat(2,minmax(0,1fr))] gap-2 @md/training-class:grid-cols-3',
        )}
      >
        <Button
          variant={stream ? 'outline' : 'default'}
          className="h-auto min-h-11 min-w-0 px-2 py-1.5 text-center whitespace-normal has-[>svg]:px-2"
          onPointerEnter={onCaptureIntent}
          onFocus={onCaptureIntent}
          onPointerDown={onCaptureIntent}
          onClick={() => {
            onCaptureIntent?.();
            fileInputRef.current?.click();
          }}
          disabled={disabled}
        >
          <Upload data-icon="inline-start" aria-hidden="true" /> Bilder auswählen
        </Button>
        <Input
          type="file"
          disabled={disabled}
          ref={fileInputRef}
          onChange={(event) => {
            if (event.currentTarget.files?.length) onCaptureIntent?.();
            onFileUpload(event);
          }}
          accept={IMAGE_INPUT_ACCEPT}
          multiple
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
        {fileActions}
      </div>
      {stream && (
        <div className="flex min-w-0 flex-col items-start gap-3">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            aria-label="Kameravorschau für Trainingsaufnahme"
            className={cn(
              'aspect-[4/3] w-full max-w-64 rounded-xl bg-media-surface object-cover',
              facingMode === 'user' && 'transform scale-x-[-1]',
            )}
          />
          <RecordButton
            hintId={hintId}
            disabled={disabled}
            isRecording={isRecording}
            onStartRecording={onStartRecording}
            onStopRecording={onStopRecording}
            onCaptureIntent={onCaptureIntent}
          />
          <p id={hintId} className="text-xs text-muted-foreground">
            Zum Aufnehmen gedrückt halten.
            <span className="sr-only">
              {' '}
              Mit der Tastatur startet und stoppt Enter die Aufnahme.
            </span>
          </p>
        </div>
      )}
    </>
  );
}
