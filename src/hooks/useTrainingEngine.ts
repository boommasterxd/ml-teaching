import { useCallback, useEffect, useState } from 'react';
import type { TrainingResources } from '@/components/training/TrainingResourceHost';
import { useDeferredModule } from './use-deferred-module';
import { useAppError } from './useAppError';
import { useConsentFlow } from './useConsentFlow';

const initialResources: TrainingResources = {
  visible: true,
  models: {
    classifier: null,
    mobilenetModel: null,
    isModelLoading: true,
    loadingText: 'Das Bildtraining wird vorbereitet.',
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
  const { module, failed, prepare } = useDeferredModule(loadResourceHost);
  const resourcesActive = active && consent.hasConsented;
  useEffect(() => {
    if (resourcesActive) prepare();
  }, [resourcesActive, prepare]);

  const { saveCameraPermission, revokeCameraConsent } = consent;
  const cameraHasError = error?.category === 'camera';
  const onCameraReady = useCallback(() => {
    if (cameraHasError) clearError();
    saveCameraPermission();
  }, [cameraHasError, clearError, saveCameraPermission]);
  const clearResources = useCallback(() => setResources(initialResources), []);

  const { models, camera, visible } = resourcesActive ? resources : initialResources;
  const resourceLoadFailed = resourcesActive && failed && !module;
  const canUseModels = resourcesActive && !models.isModelLoading && models.mobilenetModel !== null;
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
    prepareResources: prepare,
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
    ResourceHost: resourcesActive ? module?.default : undefined,
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
