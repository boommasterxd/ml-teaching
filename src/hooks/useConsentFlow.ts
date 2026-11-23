import { useCallback, useState } from 'react';
import {
  TRAINING_CONSENT_DURATION,
  writeRememberedTrainingConsent,
  type RememberedTrainingConsent,
} from '@/lib/training-consent-storage';

type CameraDecision = 'pending' | 'granted' | 'declined';

interface ConsentState {
  accepted: boolean;
  camera: CameraDecision;
  expiresAt: number | null;
  restored: RememberedTrainingConsent | null;
}

const initialConsent: ConsentState = {
  accepted: false,
  camera: 'pending',
  expiresAt: null,
  restored: null,
};

export function useConsentFlow() {
  const [state, setState] = useState(initialConsent);
  const { accepted, camera, expiresAt, restored } = state;
  const grantConsent = useCallback((remember = false) => {
    const expiry = Date.now() + TRAINING_CONSENT_DURATION;
    const saved = remember && writeRememberedTrainingConsent(expiry, 'pending');
    setState({ ...initialConsent, accepted: true, expiresAt: saved ? expiry : null });
    return !remember || saved;
  }, []);
  const restore = useCallback((record: RememberedTrainingConsent) => {
    setState({
      ...initialConsent,
      accepted: true,
      camera: 'declined',
      expiresAt: record.expiresAt,
      restored: record,
    });
  }, []);
  const reset = useCallback(() => setState(initialConsent), []);
  const grantCameraConsent = useCallback(() => {
    setState((previous) => ({ ...previous, camera: 'granted', restored: null }));
  }, []);
  const saveCameraPermission = useCallback(() => {
    if (expiresAt !== null && camera === 'granted')
      writeRememberedTrainingConsent(expiresAt, 'allowed', true);
  }, [camera, expiresAt]);
  const declineCameraConsent = useCallback(() => {
    if (expiresAt !== null) writeRememberedTrainingConsent(expiresAt, 'declined', true);
    setState((previous) => ({ ...previous, camera: 'declined', restored: null }));
  }, [expiresAt]);
  const requestCameraConsent = useCallback(() => {
    setState((previous) => ({ ...previous, camera: 'pending', restored: null }));
  }, []);

  return {
    hasConsented: accepted,
    cameraConsent: camera === 'granted',
    cameraDeclined: camera === 'declined',
    restored,
    grantConsent,
    grantCameraConsent,
    saveCameraPermission,
    declineCameraConsent,
    revokeCameraConsent: declineCameraConsent,
    requestCameraConsent,
    restore,
    reset,
    showConsentModal: !accepted,
    showCameraModal: accepted && camera === 'pending',
    isFullyConsented: accepted && camera === 'granted',
  };
}
