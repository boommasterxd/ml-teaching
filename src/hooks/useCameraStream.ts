import { useState, useEffect, useRef, useCallback } from 'react';
import type React from 'react';

export function useCameraStream(
  cameraConsent: boolean,
  isModelLoading: boolean,
  predictVideoRef: React.RefObject<HTMLVideoElement | null>,
  onError: (msg: string) => void
) {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const setupWebcam = useCallback(async () => {
    if (!cameraConsent) return;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        streamRef.current = mediaStream;
        setStream(mediaStream);
      } catch (err) {
        console.error('Error accessing webcam:', err);
        onError('Kamerazugriff verweigert oder keine Kamera gefunden.');
      }
    }
  }, [facingMode, cameraConsent, onError]);

  useEffect(() => {
    setupWebcam();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [setupWebcam]);

  // Kamera-Stream an Vorhersage-Video anhängen, wenn Stream oder Ladestatus sich ändert.
  // isModelLoading als Dep ist nötig, weil das Video-Element erst nach dem Laden im DOM erscheint.
  useEffect(() => {
    if (predictVideoRef.current && stream) {
      predictVideoRef.current.srcObject = stream;
    }
  }, [stream, isModelLoading, predictVideoRef]);

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  return { facingMode, stream, streamRef, toggleCamera };
}
