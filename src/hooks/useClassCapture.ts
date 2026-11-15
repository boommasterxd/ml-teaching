import { useState, useRef, useEffect, useCallback } from 'react';
import { CAMERA, ML } from '../constants';
import { processImageFiles } from '../lib/image-upload';
import type { MLClass } from '../types/ml';
import type React from 'react';

export interface CaptureActions {
  captureDisabled: boolean;
  onUploadStart: () => boolean;
  onUploadEnd: () => void;
  onAddExample: (classId: string, video: HTMLVideoElement) => void;
  onAddImageExample: (classId: string, image: HTMLImageElement) => void | Promise<void>;
  onError: (message: string) => void;
}

interface UploadBatch {
  controller: AbortController;
  finish: () => void;
}

function cancelUpload(batch: UploadBatch | null) {
  batch?.controller.abort();
  batch?.finish();
}

/** Bounded capture/upload lifecycle for one class; callbacks use current workspace state. */
export function useClassCapture(cls: MLClass, actions: CaptureActions) {
  const [recordingVersion, setRecordingVersion] = useState<number | null>(null);
  const captureVersion = cls.captureVersion ?? 0;
  const isRecording = recordingVersion !== null && recordingVersion === captureVersion;
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const uploadRef = useRef<UploadBatch | null>(null);
  const latest = useRef({ cls, actions });
  useEffect(() => {
    latest.current = { cls, actions };
  }, [cls, actions]);

  const stopRecording = useCallback(() => {
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRecordingVersion(null);
  }, []);
  const startRecording = useCallback(() => {
    if (
      !videoRef.current ||
      latest.current.actions.captureDisabled ||
      intervalRef.current !== null ||
      latest.current.cls.images.length >= ML.MAX_IMAGES_PER_CLASS
    )
      return;
    setRecordingVersion(latest.current.cls.captureVersion ?? 0);
    const capture = () => {
      if (
        latest.current.actions.captureDisabled ||
        latest.current.cls.images.length >= ML.MAX_IMAGES_PER_CLASS
      ) {
        stopRecording();
        return;
      }
      if (videoRef.current)
        latest.current.actions.onAddExample(latest.current.cls.id, videoRef.current);
    };
    capture();
    intervalRef.current = setInterval(capture, CAMERA.CAPTURE_INTERVAL_MS);
  }, [stopRecording]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { cls: current } = latest.current;
    const files = Array.from(event.target.files ?? []).slice(
      0,
      ML.MAX_IMAGES_PER_CLASS - current.images.length,
    );
    event.target.value = '';
    if (!files.length || !latest.current.actions.onUploadStart()) return;
    cancelUpload(uploadRef.current);
    const controller = new AbortController();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      latest.current.actions.onUploadEnd();
    };
    uploadRef.current = { controller, finish };
    void processImageFiles(
      files,
      (image) => latest.current.actions.onAddImageExample(current.id, image),
      (message) => latest.current.actions.onError(message),
      controller.signal,
    )
      .catch(() => latest.current.actions.onError('Die Bilder konnten nicht verarbeitet werden.'))
      .finally(finish);
  }, []);

  useEffect(() => {
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    intervalRef.current = null;
    cancelUpload(uploadRef.current);
  }, [captureVersion]);

  useEffect(
    () => () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
      cancelUpload(uploadRef.current);
    },
    [],
  );

  return { videoRef, isRecording, startRecording, stopRecording, handleFileUpload };
}
