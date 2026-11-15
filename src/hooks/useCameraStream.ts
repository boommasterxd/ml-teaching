/** Camera tracks belong to one consent/facing-mode effect, including late requests. */
import { useState, useEffect, useRef, useCallback, useEffectEvent } from 'react';
import type React from 'react';
import { CAMERA } from '../constants';
import type { ErrorCategory } from '../types/errors';

export function useCameraStream(
  cameraConsent: boolean,
  isModelLoading: boolean,
  predictVideoRef: React.RefObject<HTMLVideoElement | null>,
  onError: (category: Extract<ErrorCategory, 'camera'>, msg: string) => void,
) {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [camera, setCamera] = useState<{ stream: MediaStream; facingMode: string } | null>(null);
  const cameraActive = cameraConsent && !isModelLoading;
  const stream = cameraActive && camera?.facingMode === facingMode ? camera.stream : null;
  const streamRef = useRef<MediaStream | null>(null);
  const reportError = useEffectEvent(onError);

  useEffect(() => {
    if (!cameraActive) return;
    let active = true;
    let ownedStream: MediaStream | null = null;

    async function requestCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera unavailable.');
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
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
        setCamera({ stream: mediaStream, facingMode });
      } catch {
        if (active) reportError('camera', 'Kamerazugriff verweigert oder keine Kamera gefunden.');
      }
    }
    void requestCamera();
    return () => {
      active = false;
      ownedStream?.getTracks().forEach((track) => track.stop());
      if (streamRef.current === ownedStream) streamRef.current = null;
    };
  }, [cameraActive, facingMode]);

  useEffect(() => {
    const video = predictVideoRef.current;
    if (!video) return;
    video.srcObject = stream;
    return () => {
      if (video.srcObject === stream) video.srcObject = null;
    };
  }, [stream, isModelLoading, predictVideoRef]);

  const toggleCamera = useCallback(() => {
    setFacingMode((previous) => (previous === 'user' ? 'environment' : 'user'));
  }, []);

  return { facingMode, stream, streamRef, toggleCamera };
}
