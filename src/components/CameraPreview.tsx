import type React from 'react';
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import { Camera } from './icons/camera';
import { Square } from './icons/square';
import { Upload } from './icons/upload';
import Button from './Button';
import CameraControls, { type CameraView } from './CameraControls';
import { Input } from './ui/input';
import { cn } from '../lib/utils';
import { IMAGE_INPUT_ACCEPT } from '../lib/image-input-policy';

export interface CameraPreviewProps {
  disabled: boolean;
  camera?: CameraView;
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

function usePreviewVisibility(previewRef: React.RefObject<HTMLDivElement | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;
    let inViewport = false;
    const updateVisibility = () => setVisible(inViewport && !document.hidden);
    const observer = new IntersectionObserver((entries) => {
      inViewport = entries.at(-1)?.isIntersecting ?? false;
      updateVisibility();
    });
    observer.observe(preview);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, [previewRef]);
  return visible;
}

function LiveCameraPreview(props: CameraPreviewProps & { camera: CameraView }) {
  const { disabled, camera, videoRef, isRecording } = props;
  const { stream, facingMode } = camera;
  const previewRef = useRef<HTMLDivElement>(null);
  const visible = usePreviewVisibility(previewRef);
  const attachedStream = visible || isRecording ? stream : null;

  useLayoutEffect(() => {
    const video = videoRef.current;
    if (!video || !attachedStream) return;
    video.srcObject = attachedStream;
    return () => {
      if (video.srcObject === attachedStream) video.srcObject = null;
    };
  }, [attachedStream, videoRef]);

  return (
    <div className="grid w-full min-w-0 max-w-80 gap-2 justify-self-center">
      <div
        ref={previewRef}
        data-slot="camera-preview"
        className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-media-surface"
      >
        {stream && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            aria-label="Kameravorschau für Trainingsaufnahme"
            className={cn(
              'absolute inset-0 size-full object-cover',
              facingMode === 'user' && 'transform scale-x-[-1]',
            )}
          />
        )}
        <CameraControls camera={camera} />
      </div>
      <RecordButton {...props} disabled={disabled || !stream} />
    </div>
  );
}

/** Camera attachment and capture cleanup follow the browser stream. */
export default function CameraPreview(props: CameraPreviewProps) {
  const {
    camera,
    isRecording,
    onStopRecording,
    onFileUpload,
    disabled,
    fileActions,
    onCaptureIntent,
  } = props;
  const stream = camera?.stream;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endCapture = useEffectEvent(onStopRecording);
  useEffect(() => {
    if (stream) return () => endCapture();
  }, [stream]);
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
      {camera && <LiveCameraPreview {...props} camera={camera} />}
    </>
  );
}
