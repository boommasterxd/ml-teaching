/**
 * Hook that manages the camera MediaStream lifecycle (setup, teardown, facing mode toggle).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import type React from 'react';
import { CAMERA } from '../constants';

/** Requests camera access once consent is given and attaches the stream to a video element. */
export function useCameraStream(
  cameraConsent: boolean,
  isModelLoading: boolean,
  predictVideoRef: React.RefObject<HTMLVideoElement | null>,
  onError: (category: 'camera', msg: string) => void
) {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /** Initializes or restarts the webcam stream with the current facing mode. */
  const setupWebcam = useCallback(async () => {
    if (!cameraConsent) return;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: CAMERA.IDEAL_WIDTH }, height: { ideal: CAMERA.IDEAL_HEIGHT } },
          audio: false,
        });
        streamRef.current = mediaStream;
        setStream(mediaStream);
      } catch (err) {
        console.error('Error accessing webcam:', err);
        onError('camera', 'Kamerazugriff verweigert oder keine Kamera gefunden.');
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

  // Attach stream to prediction video element. isModelLoading is a dependency
  // because the video element only appears in the DOM after loading completes.
  useEffect(() => {
    if (predictVideoRef.current && stream) {
      predictVideoRef.current.srcObject = stream;
    }
  }, [stream, isModelLoading, predictVideoRef]);

  /** Toggles between front and rear camera. */
  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  return { facingMode, stream, streamRef, toggleCamera };
}
