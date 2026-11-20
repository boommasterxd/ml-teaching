import type React from 'react';
import { useEffect, useEffectEvent, useRef } from 'react';
import { Camera } from './icons/camera';
import { Square } from './icons/square';
import { SwitchCamera } from './icons/switch-camera';
import { Upload } from './icons/upload';
import Button from './Button';
import { Input } from './ui/input';
import { Spinner } from './ui/spinner';
import { cn } from '../lib/utils';
import { IMAGE_INPUT_ACCEPT } from '../lib/image-input-policy';

export interface CameraPreviewProps {
  disabled: boolean;
  stream: MediaStream | null;
  facingMode: 'user' | 'environment';
  isCameraSwitching: boolean;
  onSwitchCamera: React.MouseEventHandler<HTMLButtonElement>;
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
>;

const touchHoldDelayMs = 350;

function RecordButton({
  disabled,
  isRecording,
  onStartRecording,
  onStopRecording,
  onCaptureIntent,
}: RecordButtonProps) {
  const touch = useRef<{ pointerId: number; timer: number; started: boolean } | null>(null);
  const suppressTouchClick = useRef(false);
  useEffect(() => () => window.clearTimeout(touch.current?.timer), []);

  const startPress = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary) return;
    suppressTouchClick.current = false;
    onCaptureIntent?.();
    if (event.pointerType !== 'touch' || disabled || isRecording) return;
    const button = event.currentTarget;
    const press = {
      pointerId: event.pointerId,
      started: false,
      timer: window.setTimeout(() => {
        if (button.disabled || document.hidden) return;
        press.started = true;
        suppressTouchClick.current = true;
        onStartRecording();
      }, touchHoldDelayMs),
    };
    touch.current = press;
  };

  const finishPress = (event: React.PointerEvent<HTMLButtonElement>) => {
    const press = touch.current;
    if (!press || press.pointerId !== event.pointerId) return;
    touch.current = null;
    window.clearTimeout(press.timer);
    if (press.started) onStopRecording();
  };

  return (
    <Button
      variant={isRecording ? 'destructive' : 'default'}
      size="lg"
      disabled={disabled && !isRecording}
      className="min-h-11 w-full touch-manipulation select-none [-webkit-touch-callout:none]"
      onPointerEnter={onCaptureIntent}
      onFocus={onCaptureIntent}
      onPointerDown={startPress}
      onPointerUp={finishPress}
      onPointerCancel={finishPress}
      onLostPointerCapture={finishPress}
      onContextMenu={(event) => {
        if (touch.current || suppressTouchClick.current) event.preventDefault();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.repeat) event.preventDefault();
      }}
      onClick={(event) => {
        if (event.detail > 0 && suppressTouchClick.current) {
          suppressTouchClick.current = false;
          return;
        }
        if (isRecording) onStopRecording();
        else {
          onCaptureIntent?.();
          onStartRecording();
        }
      }}
    >
      {isRecording ? (
        <Square data-icon="inline-start" className="fill-current" aria-hidden="true" />
      ) : (
        <Camera data-icon="inline-start" aria-hidden="true" />
      )}
      {isRecording ? 'Aufnahme stoppen' : 'Aufnehmen'}
    </Button>
  );
}

function LiveCameraPreview(props: CameraPreviewProps) {
  const { disabled, stream, facingMode, isCameraSwitching, onSwitchCamera, videoRef } = props;
  return (
    <div className="grid w-full min-w-0 max-w-80 gap-2 justify-self-center">
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-label="Kameravorschau für Trainingsaufnahme"
          className={cn(
            'aspect-[4/3] w-full rounded-2xl bg-media-surface object-cover',
            facingMode === 'user' && 'transform scale-x-[-1]',
          )}
        />
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-2 bottom-2 size-11 shadow-sm"
          aria-label="Kamera wechseln"
          title="Kamera wechseln"
          aria-disabled={isCameraSwitching || undefined}
          onClick={isCameraSwitching ? undefined : onSwitchCamera}
        >
          {isCameraSwitching ? (
            <Spinner aria-hidden="true" />
          ) : (
            <SwitchCamera data-icon aria-hidden="true" />
          )}
        </Button>
      </div>
      <RecordButton {...props} disabled={disabled || !stream} />
    </div>
  );
}

/** Camera attachment and capture cleanup follow the browser stream. */
export default function CameraPreview(props: CameraPreviewProps) {
  const {
    stream,
    isRecording,
    onStopRecording,
    onFileUpload,
    videoRef,
    disabled,
    fileActions,
    onCaptureIntent,
    isCameraSwitching,
  } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  useEffect(() => {
    if (!isRecording) return;
    const stopWhenHidden = () => {
      if (document.hidden) endCapture();
    };
    document.addEventListener('visibilitychange', stopWhenHidden);
    return () => document.removeEventListener('visibilitychange', stopWhenHidden);
  }, [isRecording]);
  return (
    <>
      <div
        className={cn(
          'col-span-full',
          fileActions &&
            'grid grid-cols-[minmax(max-content,2.4fr)_repeat(2,minmax(2.75rem,1fr))] gap-2 @md/training-class:grid-cols-[repeat(3,minmax(max-content,1fr))]',
        )}
      >
        <Button
          variant={stream ? 'outline' : 'default'}
          className="h-auto min-h-11 px-2 py-1.5 has-[>svg]:px-2"
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
      {(stream || isCameraSwitching) && <LiveCameraPreview {...props} />}
    </>
  );
}
