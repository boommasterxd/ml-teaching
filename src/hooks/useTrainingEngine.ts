import { useEffect, useState, useSyncExternalStore } from 'react';
import { useAppError } from './useAppError';
import { useCameraStream } from './useCameraStream';
import { useConsentFlow } from './useConsentFlow';
import { useModelLoader } from './useModelLoader';

export function subscribeToVisibility(notify: () => void) {
  document.addEventListener('visibilitychange', notify);
  return () => document.removeEventListener('visibilitychange', notify);
}

export function useTrainingEngine(active: boolean, canRestoreCamera = active) {
  const consent = useConsentFlow();
  const { error, setError, clearError } = useAppError();
  const [cameraNeeded, setCameraNeeded] = useState(true);
  const [modelAttempt, setModelAttempt] = useState(0);
  const visible = useSyncExternalStore(
    subscribeToVisibility,
    () => !document.hidden,
    () => true,
  );
  const models = useModelLoader(active && consent.hasConsented, setError, undefined, modelAttempt);
  const canUseModels = !models.isModelLoading && models.mobilenetModel !== null;
  const { restored, grantCameraConsent, saveCameraPermission, revokeCameraConsent } = consent;
  useEffect(() => {
    if (
      !active ||
      !canRestoreCamera ||
      !visible ||
      restored?.camera !== 'allowed' ||
      !navigator.permissions?.query
    )
      return;
    let current = true;
    void navigator.permissions.query({ name: 'camera' }).then(
      (permission) => {
        if (current && permission.state === 'granted') grantCameraConsent();
      },
      () => {},
    );
    return () => {
      current = false;
    };
  }, [active, canRestoreCamera, visible, restored, grantCameraConsent]);

  const camera = useCameraStream(
    active && consent.cameraConsent && canUseModels,
    models.isModelLoading,
    setError,
    visible && cameraNeeded,
    () => {
      if (error?.category === 'camera') clearError();
      saveCameraPermission();
    },
  );

  return {
    consent,
    models,
    camera,
    error,
    clearError,
    visible,
    canUseModels,
    setCameraNeeded,
    retryModels: () => {
      clearError();
      setModelAttempt((attempt) => attempt + 1);
    },
    revokeCamera: () => {
      revokeCameraConsent();
      if (error?.category === 'camera') clearError();
    },
  };
}

export type TrainingEngine = ReturnType<typeof useTrainingEngine>;
