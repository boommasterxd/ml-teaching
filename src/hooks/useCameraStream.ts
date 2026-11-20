/** Camera tracks belong to one consent/facing-mode effect, including late requests. */
import { useState, useEffect, useRef, useCallback, useEffectEvent } from 'react';
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

export function useCameraStream(
  cameraConsent: boolean,
  isModelLoading: boolean,
  onError: (category: Extract<ErrorCategory, 'camera'>, msg: string) => void,
) {
  const cameraActive = cameraConsent && !isModelLoading;
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

  useEffect(() => {
    if (!request.active) return;
    let active = true;
    let ownedStream: MediaStream | null = null;
    let tracks: MediaStreamTrack[] = [];

    function releaseCamera() {
      if (streamRef.current === ownedStream) streamRef.current = null;
      ownedStream = null;
      for (const track of tracks) {
        track.removeEventListener('ended', handleTrackEnded);
        track.stop();
      }
      tracks = [];
    }

    function fail(message: string) {
      failedRequestRef.current = request;
      setResult({ request, stream: null });
      reportError('camera', message);
    }

    function handleTrackEnded() {
      if (!active || !ownedStream) return;
      releaseCamera();
      fail('Die Kameraverbindung wurde unterbrochen.');
    }

    async function requestCamera() {
      const mediaStream = await openCamera(request.facingMode).catch(() => null);
      if (!mediaStream) {
        if (active) fail('Kamerazugriff verweigert oder keine Kamera gefunden.');
        return;
      }
      if (!active) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }
      tracks = mediaStream.getTracks();
      ownedStream = mediaStream;
      streamRef.current = mediaStream;
      for (const track of tracks) track.addEventListener('ended', handleTrackEnded);
      if (tracks.some((track) => track.readyState === 'ended')) handleTrackEnded();
      else setResult({ request, stream: mediaStream });
    }
    void requestCamera();
    return () => {
      active = false;
      releaseCamera();
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
