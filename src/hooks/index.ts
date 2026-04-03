/**
 * index.ts
 *
 * Barrel export for all custom hooks. Enables callers to import multiple hooks
 * from a single path instead of separate per-file imports.
 */
export { useAppError } from './useAppError';
export { useConsentFlow } from './useConsentFlow';
export { useModalState } from './useModalState';
export { useCameraStream } from './useCameraStream';
export { useFocusTrap } from './useFocusTrap';
export { default as useScrollLock } from './useScrollLock';
export { useNeuralNetAnimation } from './useNeuralNetAnimation';
export { usePageTitle } from './usePageTitle';
export { useClassManagement } from './useClassManagement';
export { useImageFeatureExtraction } from './useImageFeatureExtraction';
export { useModelTraining } from './useModelTraining';
export { useModelLoader, loadWithRetry } from './useModelLoader';
export { usePredictionLoop } from './usePredictionLoop';
