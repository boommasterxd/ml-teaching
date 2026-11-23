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
  cameraWork: AbortController | null;
}

const initialConsent: ConsentState = {
  accepted: false,
  camera: 'pending',
  expiresAt: null,
  restored: null,
  cameraWork: null,
};

export function useConsentFlow() {
  const [state, setState] = useState(initialConsent);
  const { accepted, camera, expiresAt, restored, cameraWork } = state;
  const grantConsent = useCallback((remember = false) => {
    const expiry = Date.now() + TRAINING_CONSENT_DURATION;
    if (remember) writeRememberedTrainingConsent(expiry, 'pending');
    setState({
      ...initialConsent,
      accepted: true,
      expiresAt: remember ? expiry : null,
      cameraWork: new AbortController(),
    });
  }, []);
  const restore = useCallback((record: RememberedTrainingConsent) => {
    setState({
      ...initialConsent,
      accepted: true,
      camera: 'declined',
      expiresAt: record.expiresAt,
      restored: record,
      cameraWork: new AbortController(),
    });
  }, []);
  const reset = useCallback(() => setState(initialConsent), []);
  const cancel = useCallback(() => {
    cameraWork?.abort();
    reset();
  }, [cameraWork, reset]);
  const grantCameraConsent = useCallback(() => {
    setState((previous) =>
      previous.cameraWork?.signal.aborted === false
        ? { ...previous, camera: 'granted', restored: null }
        : previous,
    );
  }, []);
  const saveCameraPermission = useCallback(() => {
    if (expiresAt !== null && camera === 'granted' && cameraWork?.signal.aborted === false)
      writeRememberedTrainingConsent(expiresAt, 'allowed', true);
  }, [camera, cameraWork, expiresAt]);
  const declineCameraConsent = useCallback(() => {
    cameraWork?.abort();
    if (expiresAt !== null) writeRememberedTrainingConsent(expiresAt, 'declined', true);
    setState((previous) => ({
      ...previous,
      camera: 'declined',
      restored: null,
      cameraWork: null,
    }));
  }, [cameraWork, expiresAt]);
  const requestCameraConsent = useCallback(() => {
    cameraWork?.abort();
    const cameraRequest = new AbortController();
    setState((previous) => ({
      ...previous,
      camera: 'pending',
      restored: null,
      cameraWork: cameraRequest,
    }));
  }, [cameraWork]);

  return {
    hasConsented: accepted,
    cameraConsent: camera === 'granted',
    cameraDeclined: camera === 'declined',
    restored,
    cameraSignal: cameraWork?.signal,
    grantConsent,
    grantCameraConsent,
    saveCameraPermission,
    declineCameraConsent,
    revokeCameraConsent: declineCameraConsent,
    requestCameraConsent,
    restore,
    cancel,
    reset,
    showConsentModal: !accepted,
    showCameraModal: accepted && camera === 'pending',
    isFullyConsented: accepted && camera === 'granted',
  };
}
