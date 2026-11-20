/** Camera tracks belong to one consent/facing-mode effect, including late requests. */
import { useState, useEffect, useRef, useCallback, useEffectEvent } from 'react';
import { CAMERA } from '../constants';
import type { ErrorCategory } from '../types/errors';

interface CameraRequest {
  active: boolean;
  facingMode: 'user' | 'environment';
  switching: boolean;
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
  }
  const { facingMode } = request;
  const stream = cameraActive && result?.request === request ? result.stream : null;
  const isPending = cameraActive && result?.request !== request;
  const isSwitching = isPending && request.switching;
  const streamRef = useRef<MediaStream | null>(null);
  const reportError = useEffectEvent(onError);

  useEffect(() => {
    if (!request.active) return;
    let active = true;
    let ownedStream: MediaStream | null = null;

    async function requestCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera unavailable.');
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: request.facingMode,
            width: { ideal: CAMERA.IDEAL_WIDTH },
            height: { ideal: CAMERA.IDEAL_HEIGHT },
          },
          audio: false,
        });
        if (!active) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        ownedStream = mediaStream;
        streamRef.current = mediaStream;
        setResult({ request, stream: mediaStream });
      } catch {
        if (!active) return;
        setResult({ request, stream: null });
        reportError('camera', 'Kamerazugriff verweigert oder keine Kamera gefunden.');
      }
    }
    void requestCamera();
    return () => {
      active = false;
      ownedStream?.getTracks().forEach((track) => track.stop());
      if (streamRef.current === ownedStream) streamRef.current = null;
    };
  }, [request]);

  const toggleCamera = useCallback(() => {
    const switching = streamRef.current !== null;
    setRequest((previous) => ({
      active: previous.active,
      facingMode: previous.facingMode === 'user' ? 'environment' : 'user',
      switching,
    }));
  }, []);

  return { facingMode, stream, streamRef, isPending, isSwitching, toggleCamera };
}
