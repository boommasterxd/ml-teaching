/**
 * Hook that manages the two-step consent flow:
 * 1. GDPR/privacy consent (required before model loading)
 * 2. Camera access consent (required before webcam activation)
 */
import { useState, useCallback } from 'react';

/** Encapsulates DSGVO + camera consent state with derived modal visibility flags. */
export function useConsentFlow() {
  const [hasConsented, setHasConsented] = useState(false);
  const [cameraConsent, setCameraConsent] = useState(false);

  const grantConsent = useCallback(() => setHasConsented(true), []);
  const grantCameraConsent = useCallback(() => setCameraConsent(true), []);

  return {
    hasConsented,
    cameraConsent,
    grantConsent,
    grantCameraConsent,
    showConsentModal: !hasConsented,
    showCameraModal: hasConsented && !cameraConsent,
    isFullyConsented: hasConsented && cameraConsent,
  };
}
