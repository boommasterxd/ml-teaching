/**
 * useConsentFlow.ts
 *
 * Manages the two-step consent flow: GDPR/privacy consent followed by camera
 * access consent. Derives modal visibility flags from the underlying state.
 */
import { useState, useCallback } from 'react';

/**
 * Tracks GDPR and camera consent state and exposes derived modal visibility flags.
 *
 * The consent sequence is strictly ordered: the privacy consent modal must be
 * accepted before the camera consent modal becomes visible. Only after both
 * consents are granted is `isFullyConsented` true.
 *
 * @returns An object containing:
 *   - `hasConsented` — whether the user accepted the GDPR/privacy notice.
 *   - `cameraConsent` — whether the user granted camera access.
 *   - `grantConsent` — callback to accept the GDPR/privacy notice.
 *   - `grantCameraConsent` — callback to grant camera access.
 *   - `showConsentModal` — true while GDPR consent is still pending.
 *   - `showCameraModal` — true after GDPR consent but before camera consent.
 *   - `isFullyConsented` — true once both consents have been granted.
 */
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
