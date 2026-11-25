import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { CAMERA, ML } from '../constants';
import { processImageFiles } from '../lib/image-upload';
import type { MLClass, MLImage } from '../types/ml';
import type React from 'react';

export interface CaptureTarget {
  signal: AbortSignal;
  receive: (image: MLImage) => void;
}

interface CapturedFrames {
  images: readonly MLImage[];
  version: number;
  stream: HTMLVideoElement['srcObject'];
}

export interface CaptureActions {
  captureDisabled: boolean;
  onUploadStart: () => boolean;
  onUploadEnd: () => void;
  onAddExample: (
    classId: string,
    video: HTMLVideoElement,
    target?: CaptureTarget,
  ) => void | Promise<void>;
  onCommitCapture: (classId: string, frames: CapturedFrames) => void;
  onAddImageExample: (
    classId: string,
    image: HTMLImageElement,
    signal: AbortSignal,
  ) => 'capacity' | void | Promise<'capacity' | void>;
  onError: (message: string) => void;
  onUploadResult: (classId: string, report: UploadFailureReport | null) => void;
}

interface UploadFailureReport {
  className: string;
  total: number;
  details: string[];
  capacitySkipped?: number;
}

const uploadFailureDetailLimit = 5;

interface UploadBatch {
  controller: AbortController;
  finish: () => void;
}

interface CameraRecording {
  interval: ReturnType<typeof setInterval>;
  held: (CapturedFrames & { controller: AbortController; images: MLImage[] }) | null;
}

type CaptureState = React.RefObject<{ cls: MLClass; actions: CaptureActions }>;

function cancelUpload(batch: UploadBatch | null) {
  batch?.controller.abort();
  batch?.finish();
}

function endRecording(recording: CameraRecording | null) {
  if (!recording) return;
  clearInterval(recording.interval);
  recording.held?.controller.abort();
}

function useCameraCapture(latest: CaptureState, captureVersion: number) {
  const [recordingVersion, setRecordingVersion] = useState<number | null>(null);
  const isRecording = recordingVersion !== null && recordingVersion === captureVersion;
  const videoRef = useRef<HTMLVideoElement>(null);
  const recordingRef = useRef<CameraRecording | null>(null);

  const stopRecording = useCallback(
    (commitHold = false) => {
      const recording = recordingRef.current;
      recordingRef.current = null;
      endRecording(recording);
      setRecordingVersion(null);
      const held = recording?.held;
      if (commitHold && held?.images.length && held.stream === videoRef.current?.srcObject) {
        const { cls, actions } = latest.current;
        actions.onCommitCapture(cls.id, {
          images: held.images,
          stream: held.stream,
          version: held.version,
        });
      }
    },
    [latest],
  );
  const startRecording = useCallback(
    (hold = false) => {
      const { cls, actions } = latest.current;
      if (
        !videoRef.current ||
        actions.captureDisabled ||
        recordingRef.current ||
        cls.images.length >= ML.MAX_IMAGES_PER_CLASS
      )
        return;
      const held: CameraRecording['held'] = hold
        ? { controller: new AbortController(), images: [], stream: null, version: captureVersion }
        : null;
      const target = held && {
        signal: held.controller.signal,
        receive: (image: MLImage) => {
          if (!held.controller.signal.aborted) held.images.push(image);
        },
      };
      async function capture() {
        const current = latest.current;
        const video = videoRef.current;
        const stream = video?.srcObject;
        if (current.actions.captureDisabled || (held?.stream && held.stream !== stream)) {
          stopRecording();
          return;
        }
        if (current.cls.images.length + (held?.images.length ?? 0) >= ML.MAX_IMAGES_PER_CLASS) {
          if (held) clearInterval(recording.interval);
          else stopRecording();
          return;
        }
        if (!video || !stream) return;
        if (held) {
          // Keep the first attached stream, even while waiting for its first frame.
          held.stream ??= stream;
          if (video.readyState < video.HAVE_CURRENT_DATA) return;
        }
        try {
          if (target) await current.actions.onAddExample(cls.id, video, target);
          else await current.actions.onAddExample(cls.id, video);
        } catch {
          if (recordingRef.current !== recording) return;
          stopRecording();
          latest.current.actions.onError(
            'Das Kamerabild konnte nicht verarbeitet werden. Bitte starte die Aufnahme erneut.',
          );
        }
      }
      const recording = {
        held,
        interval: setInterval(() => void capture(), CAMERA.CAPTURE_INTERVAL_MS),
      };
      recordingRef.current = recording;
      setRecordingVersion(captureVersion);
      void capture();
    },
    [latest, captureVersion, stopRecording],
  );
  useEffect(
    () => () => {
      endRecording(recordingRef.current);
      recordingRef.current = null;
    },
    [captureVersion],
  );
  return { videoRef, isRecording, startRecording, stopRecording };
}

/** Bounded capture/upload lifecycle for one class; callbacks use current workspace state. */
export function useClassCapture(cls: MLClass, actions: CaptureActions) {
  const latest = useRef({ cls, actions });
  useLayoutEffect(() => {
    latest.current = { cls, actions };
  }, [cls, actions]);
  const captureVersion = cls.captureVersion ?? 0;
  const recording = useCameraCapture(latest, captureVersion);
  const [uploadingVersion, setUploadingVersion] = useState<number | null>(null);
  const uploadRef = useRef<UploadBatch | null>(null);
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { cls: current } = latest.current;
    const selectedCount = event.target.files?.length ?? 0;
    const files = Array.from(event.target.files ?? []).slice(
      0,
      ML.MAX_IMAGES_PER_CLASS - current.images.length,
    );
    event.target.value = '';
    if (!selectedCount || !latest.current.actions.onUploadStart()) return;
    cancelUpload(uploadRef.current);
    const controller = new AbortController();
    const version = current.captureVersion ?? 0;
    setUploadingVersion(version);
    let capacitySkipped = selectedCount - files.length;
    const report: UploadFailureReport = {
      className: current.name,
      total: 0,
      details: [],
    };
    function reportFailure(message: string) {
      if (controller.signal.aborted) return;
      report.total++;
      if (report.details.length < uploadFailureDetailLimit) report.details.push(message);
    }
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      latest.current.actions.onUploadEnd();
    };
    uploadRef.current = { controller, finish };
    void processImageFiles(
      files,
      (image) => latest.current.actions.onAddImageExample(current.id, image, controller.signal),
      reportFailure,
      controller.signal,
      () => {
        const { cls } = latest.current;
        return (
          cls.id === current.id &&
          (cls.captureVersion ?? 0) === version &&
          cls.images.length < ML.MAX_IMAGES_PER_CLASS
        );
      },
    )
      .then((remaining) => {
        capacitySkipped += remaining;
      })
      .catch(() => {
        reportFailure('Die Bilder konnten nicht verarbeitet werden.');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          uploadRef.current = null;
          const { cls, actions } = latest.current;
          if ((cls.captureVersion ?? 0) === version) {
            report.className = cls.name;
            if (capacitySkipped) report.capacitySkipped = capacitySkipped;
            actions.onUploadResult(current.id, report.total || capacitySkipped ? report : null);
          }
          setUploadingVersion(null);
        }
        finish();
      });
  }, []);
  useEffect(() => () => cancelUpload(uploadRef.current), [captureVersion]);
  return { ...recording, isUploading: uploadingVersion === captureVersion, handleFileUpload };
}
