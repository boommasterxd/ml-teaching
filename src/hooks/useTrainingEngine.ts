import { useCallback, useEffect, useState } from 'react';
import { useMenuModule } from '@/components/use-menu-module';
import { useAppError } from './useAppError';
import type { useCameraStream } from './useCameraStream';
import { useConsentFlow } from './useConsentFlow';
import type { useModelLoader } from './useModelLoader';

export { subscribeToVisibility } from '@/components/training/TrainingEntryContext';

export interface TrainingResources {
  visible: boolean;
  models: ReturnType<typeof useModelLoader>;
  camera: ReturnType<typeof useCameraStream>;
}

const initialResources: TrainingResources = {
  visible: true,
  models: {
    classifier: null,
    mobilenetModel: null,
    isModelLoading: true,
    loadingText: 'Initialisiere TensorFlow.js...',
    setClassifier: () => {},
  },
  camera: {
    facingMode: 'user',
    stream: null,
    streamRef: { current: null },
    isPending: false,
    isSwitching: false,
    hasFailed: false,
    toggleCamera: () => {},
    retryCamera: () => {},
  },
};

function loadResourceHost() {
  return import('@/components/training/TrainingResourceHost');
}

/** Keep consent and the initial workspace available while the browser resource host loads. */
export function useTrainingEngine(active: boolean, canRestoreCamera: boolean) {
  const consent = useConsentFlow();
  const { error, setError, clearError } = useAppError();
  const [cameraNeeded, setCameraNeeded] = useState(true);
  const [modelAttempt, setModelAttempt] = useState(0);
  const [resources, setResources] = useState(initialResources);
  const { module, failed, prepare } = useMenuModule(loadResourceHost);
  useEffect(() => {
    if (active) prepare();
  }, [active, prepare]);

  const { saveCameraPermission, revokeCameraConsent } = consent;
  const cameraHasError = error?.category === 'camera';
  const onCameraReady = useCallback(() => {
    if (cameraHasError) clearError();
    saveCameraPermission();
  }, [cameraHasError, clearError, saveCameraPermission]);
  const clearResources = useCallback(() => setResources(initialResources), []);

  const { models, camera, visible } = active ? resources : initialResources;
  const resourceLoadFailed = failed && !module;
  const canUseModels =
    consent.hasConsented && !models.isModelLoading && models.mobilenetModel !== null;
  const engine = {
    consent,
    models,
    camera,
    error,
    clearError,
    visible,
    canUseModels,
    setCameraNeeded,
    resourceLoadFailed,
    retryModels: () => {
      if (resourceLoadFailed) {
        prepare();
        return;
      }
      clearError();
      setModelAttempt((attempt) => attempt + 1);
    },
    revokeCamera: () => {
      revokeCameraConsent();
      if (cameraHasError) clearError();
    },
  };

  return {
    engine,
    prepare,
    ResourceHost: active ? module?.default : undefined,
    resourceProps: {
      cameraConsent: consent.cameraConsent,
      cameraSignal: consent.cameraSignal,
      grantCameraConsent: consent.grantCameraConsent,
      modelConsent: consent.hasConsented,
      restoreCamera: canRestoreCamera && consent.restored?.camera === 'allowed',
      cameraNeeded,
      modelAttempt,
      onError: setError,
      onCameraReady,
      publish: setResources,
      clear: clearResources,
    },
  };
}

export type TrainingEngine = ReturnType<typeof useTrainingEngine>['engine'];
