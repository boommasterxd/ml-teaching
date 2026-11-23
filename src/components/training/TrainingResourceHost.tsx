'use client';

import { memo, useLayoutEffect, useSyncExternalStore } from 'react';
import { useCameraStream } from '@/hooks/useCameraStream';
import { useModelLoader } from '@/hooks/useModelLoader';
import type { TrainingResources } from '@/hooks/useTrainingEngine';
import type { ErrorCategory } from '@/types/errors';
import { subscribeToVisibility } from './TrainingEntryContext';

interface TrainingResourceHostProps {
  cameraConsent: boolean;
  cameraSignal: AbortSignal | undefined;
  grantCameraConsent: () => void;
  modelConsent: boolean;
  restoreCamera: boolean;
  cameraNeeded: boolean;
  modelAttempt: number;
  onError: (category: Extract<ErrorCategory, 'model' | 'camera'>, message: string) => void;
  onCameraReady: () => void;
  publish: (resources: TrainingResources) => void;
  clear: () => void;
}

function useRememberedCamera({
  visible,
  restoreCamera,
  cameraSignal,
  grantCameraConsent,
}: Pick<TrainingResourceHostProps, 'restoreCamera' | 'cameraSignal' | 'grantCameraConsent'> & {
  visible: boolean;
}) {
  useLayoutEffect(() => {
    if (!visible || !restoreCamera || cameraSignal?.aborted || !navigator.permissions?.query)
      return;
    let current = true;
    void navigator.permissions.query({ name: 'camera' }).then(
      (permission) => {
        if (current && !cameraSignal?.aborted && permission.state === 'granted')
          grantCameraConsent();
      },
      () => {},
    );
    return () => {
      current = false;
    };
  }, [visible, restoreCamera, cameraSignal, grantCameraConsent]);
}

/** This sibling can load and unmount without replacing the page or its inline consent dialog. */
export default memo(function TrainingResourceHost({
  cameraConsent,
  cameraSignal,
  grantCameraConsent,
  modelConsent,
  restoreCamera,
  cameraNeeded,
  modelAttempt,
  onError,
  onCameraReady,
  publish,
  clear,
}: TrainingResourceHostProps) {
  const visible = useSyncExternalStore(
    subscribeToVisibility,
    () => !document.hidden,
    () => true,
  );
  const models = useModelLoader(modelConsent, onError, undefined, modelAttempt);
  const camera = useCameraStream(
    modelConsent && cameraConsent && !cameraSignal?.aborted && models.mobilenetModel !== null,
    models.isModelLoading,
    onError,
    visible && cameraNeeded,
    onCameraReady,
  );
  useRememberedCamera({ visible, restoreCamera, cameraSignal, grantCameraConsent });

  useLayoutEffect(() => {
    publish({ visible, models, camera });
  }, [visible, models, camera, publish]);
  useLayoutEffect(() => clear, [clear]);
  return null;
});
