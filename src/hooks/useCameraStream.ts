/**
 * useCameraStream.ts
 *
 * Hook that manages the camera MediaStream lifecycle: setup, teardown, and
 * facing mode toggle between front and rear camera.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import type React from 'react';
import { CAMERA } from '../constants';
import type { ErrorCategory } from '../types/errors';

/**
 * Manages the WebRTC camera stream, attaches it to a video element, and
 * exposes controls for toggling between front and rear cameras.
 *
 * @param cameraConsent - Whether the user has granted camera permission. No stream is started until this is `true`.
 * @param isModelLoading - Whether the ML model is still loading. Used as a dependency to re-attach the stream once the video element appears in the DOM.
 * @param predictVideoRef - Ref to the `<video>` element that receives the camera stream as its `srcObject`.
 * @param onError - Callback invoked with category `'camera'` and a human-readable message when camera access fails.
 * @returns An object containing `facingMode`, the active `stream`, a `streamRef` for imperative access, and `toggleCamera`.
 */
export function useCameraStream(
  cameraConsent: boolean,
  isModelLoading: boolean,
  predictVideoRef: React.RefObject<HTMLVideoElement | null>,
  onError: (category: Extract<ErrorCategory, 'camera'>, msg: string) => void
) {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Requests a new camera stream with the current `facingMode`, stops any
   * previously active tracks first to avoid resource leaks, and stores the
   * result in both state and the ref.
   */
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

  /**
   * Initializes the webcam stream on mount and whenever `setupWebcam` changes.
   * Stops all media tracks on cleanup to release the camera hardware.
   */
  useEffect(() => {
    setupWebcam();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [setupWebcam]);

  /**
   * Attaches the active stream to the prediction video element.
   * `isModelLoading` is listed as a dependency because the video element is
   * only mounted in the DOM after the model loading phase completes.
   */
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
