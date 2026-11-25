import type React from 'react';
import { useEffect, useEffectEvent, useId, useLayoutEffect, useRef, useState } from 'react';
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
  camera: CameraView;
  classLabel?: string;
  remainingCapacity?: number;
  isRecording: boolean;
  onStartRecording: (hold?: boolean) => void;
  onStopRecording: (commitHold?: boolean) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  fileActions?: React.ReactNode;
  onCaptureIntent?: () => void;
}

type RecordButtonProps = Pick<
  CameraPreviewProps,
  | 'isRecording'
  | 'onStartRecording'
  | 'onStopRecording'
  | 'disabled'
  | 'onCaptureIntent'
  | 'classLabel'
>;

const touchHoldDelayMs = 350;

function RecordButton({
  disabled,
  isRecording,
  onStartRecording,
  onStopRecording,
  onCaptureIntent,
  classLabel,
}: RecordButtonProps) {
  const touch = useRef<{ pointerId: number; timer: number; started: boolean } | null>(null);
  const suppressTouchClick = useRef(false);
  const label = isRecording ? 'Aufnahme stoppen' : 'Aufnehmen';
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
        onStartRecording(true);
      }, touchHoldDelayMs),
    };
    touch.current = press;
  };

  const finishPress = (event: React.PointerEvent<HTMLButtonElement>, commitHold = false) => {
    const press = touch.current;
    if (!press || press.pointerId !== event.pointerId) return;
    touch.current = null;
    window.clearTimeout(press.timer);
    if (press.started) onStopRecording(commitHold);
  };

  return (
    <Button
      variant={isRecording ? 'destructive' : 'default'}
      size="lg"
      disabled={disabled && !isRecording}
      aria-label={classLabel ? `${label} für ${classLabel}` : undefined}
      className="min-h-11 w-full touch-manipulation select-none [-webkit-touch-callout:none]"
      onPointerEnter={onCaptureIntent}
      onFocus={onCaptureIntent}
      onPointerDown={startPress}
      onPointerUp={(event) => {
        const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect();
        const { clientX, clientY } = event;
        finishPress(
          event,
          clientX >= left && clientX <= right && clientY >= top && clientY <= bottom,
        );
      }}
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
      {label}
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

function CameraVideo({
  stream,
  facingMode,
  previewRef,
  videoRef,
  isRecording,
}: Pick<CameraPreviewProps, 'videoRef' | 'isRecording'> & {
  stream: MediaStream;
  facingMode: CameraView['facingMode'];
  previewRef: React.RefObject<HTMLDivElement | null>;
}) {
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
  );
}

function LiveCameraPreview(props: CameraPreviewProps) {
  const { disabled, camera, videoRef, isRecording } = props;
  const { stream, facingMode } = camera;
  const previewRef = useRef<HTMLDivElement>(null);

  return (
    <div className="grid w-full min-w-0 max-w-80 gap-2 justify-self-center">
      <div
        ref={previewRef}
        data-slot="camera-preview"
        className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-media-surface"
      >
        {stream && (
          <CameraVideo
            stream={stream}
            facingMode={facingMode}
            previewRef={previewRef}
            videoRef={videoRef}
            isRecording={isRecording}
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
    classLabel,
    remainingCapacity,
  } = props;
  const { stream } = camera;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const capacityId = useId();
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
      <div className={cn('col-span-full', fileActions && 'flex min-w-0 flex-wrap gap-2')}>
        <Button
          variant="outline"
          className={cn(
            'h-auto min-h-11 min-w-0 max-w-full px-2 py-1.5 whitespace-normal has-[>svg]:px-2',
            fileActions && 'flex-[2.4_1_max-content] @md/training-class:flex-[1_1_max-content]',
          )}
          onPointerEnter={onCaptureIntent}
          onFocus={onCaptureIntent}
          onPointerDown={onCaptureIntent}
          onClick={() => {
            onCaptureIntent?.();
            fileInputRef.current?.click();
          }}
          disabled={disabled}
          aria-label={classLabel ? `Bilder auswählen für ${classLabel}` : undefined}
          aria-describedby={remainingCapacity === undefined ? undefined : capacityId}
        >
          <Upload data-icon="inline-start" aria-hidden="true" />
          <span className="min-w-0 wrap-anywhere">Bilder auswählen</span>
        </Button>
        {remainingCapacity !== undefined && (
          <span id={capacityId} className="sr-only">
            {remainingCapacity === 1
              ? 'Noch Platz für 1 Bild.'
              : `Noch Platz für ${remainingCapacity} Bilder.`}
          </span>
        )}
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
      <LiveCameraPreview {...props} />
    </>
  );
}
