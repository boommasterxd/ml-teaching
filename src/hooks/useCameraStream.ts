/** Camera tracks belong to one consent/facing-mode effect, including late requests. */
import {
  useState,
  useLayoutEffect,
  useRef,
  useCallback,
  useEffectEvent,
  type RefObject,
} from 'react';
import { CAMERA } from '../constants';
import type { ErrorCategory } from '../types/errors';

interface CameraRequest {
  active: boolean;
  facingMode: 'user' | 'environment';
  switching: boolean;
}

async function openCamera(facingMode: CameraRequest['facingMode']) {
  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode,
      width: { ideal: CAMERA.IDEAL_WIDTH },
      height: { ideal: CAMERA.IDEAL_HEIGHT },
    },
    audio: false,
  });
}

function stopCameraTracks(tracks: MediaStreamTrack[], onTrackEnded?: () => void) {
  for (const track of tracks) {
    if (onTrackEnded) track.removeEventListener('ended', onTrackEnded);
    track.stop();
  }
}

function connectCamera(
  facingMode: CameraRequest['facingMode'],
  streamRef: RefObject<MediaStream | null>,
  onConnected: (stream: MediaStream) => void,
  onFailed: (message: string) => void,
) {
  const startedAt = performance.now();
  const disconnectedMessage = 'Die Kameraverbindung wurde unterbrochen.';
  let active = true;
  let ownedStream: MediaStream | null = null;
  let tracks: MediaStreamTrack[] = [];
  let failureTimer: ReturnType<typeof setTimeout> | undefined;

  function releaseCamera() {
    if (streamRef.current === ownedStream) streamRef.current = null;
    ownedStream = null;
    stopCameraTracks(tracks, handleTrackEnded);
    tracks = [];
  }

  function failOpening(message: string) {
    const remaining = CAMERA.MIN_FAILURE_PENDING_MS - (performance.now() - startedAt);
    if (remaining > 0) failureTimer = setTimeout(() => onFailed(message), Math.ceil(remaining));
    else onFailed(message);
  }

  function handleTrackEnded() {
    if (!active || !ownedStream) return;
    releaseCamera();
    onFailed(disconnectedMessage);
  }

  async function requestCamera() {
    const mediaStream = await openCamera(facingMode).catch(() => null);
    if (!mediaStream) {
      if (active) failOpening('Kamerazugriff verweigert oder keine Kamera gefunden.');
      return;
    }
    if (!active) {
      stopCameraTracks(mediaStream.getTracks());
      return;
    }
    tracks = mediaStream.getTracks();
    ownedStream = mediaStream;
    streamRef.current = mediaStream;
    for (const track of tracks) track.addEventListener('ended', handleTrackEnded);
    if (tracks.some((track) => track.readyState === 'ended')) {
      releaseCamera();
      failOpening(disconnectedMessage);
    } else onConnected(mediaStream);
  }

  void requestCamera();
  return () => {
    active = false;
    clearTimeout(failureTimer);
    releaseCamera();
  };
}

export function useCameraStream(
  cameraConsent: boolean,
  isModelLoading: boolean,
  onError: (category: Extract<ErrorCategory, 'camera'>, msg: string) => void,
  needed = true,
  onReady?: () => void,
) {
  const cameraActive = cameraConsent && !isModelLoading && needed;
  const [request, setRequest] = useState<CameraRequest>({
    active: cameraActive,
    facingMode: 'user',
    switching: false,
  });
  const [result, setResult] = useState<{ request: CameraRequest; stream: MediaStream | null }>();
  if (request.active !== cameraActive) {
    setRequest({ active: cameraActive, facingMode: request.facingMode, switching: false });
    setResult(undefined);
  }
  const { facingMode } = request;
  const stream = cameraActive && result?.request === request ? result.stream : null;
  const isPending = cameraActive && result?.request !== request;
  const isSwitching = isPending && request.switching;
  const hasFailed = cameraActive && result?.request === request && result.stream === null;
  const streamRef = useRef<MediaStream | null>(null);
  const failedRequestRef = useRef<CameraRequest | null>(null);
  const reportError = useEffectEvent(onError);
  const reportReady = useEffectEvent(() => onReady?.());

  useLayoutEffect(() => {
    if (!request.active) return;
    const disconnect = connectCamera(
      request.facingMode,
      streamRef,
      (stream) => {
        setResult({ request, stream });
        reportReady();
      },
      (message) => {
        failedRequestRef.current = request;
        setResult({ request, stream: null });
        reportError('camera', message);
      },
    );
    return () => {
      disconnect();
      if (failedRequestRef.current === request) failedRequestRef.current = null;
    };
  }, [request]);

  const toggleCamera = useCallback(() => {
    const switching = streamRef.current !== null;
    setResult(undefined);
    setRequest((previous) => ({
      active: previous.active,
      facingMode: previous.facingMode === 'user' ? 'environment' : 'user',
      switching,
    }));
  }, []);

  const retryCamera = useCallback(() => {
    const failed = failedRequestRef.current;
    setRequest((previous) => (previous === failed ? { ...previous, switching: false } : previous));
  }, []);

  return {
    facingMode,
    stream,
    streamRef,
    isPending,
    isSwitching,
    hasFailed,
    toggleCamera,
    retryCamera,
  };
}
