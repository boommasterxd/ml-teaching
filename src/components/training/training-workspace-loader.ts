import { createRetryableLoader } from '@/lib/create-retryable-loader';

export const loadTrainingWorkspace = createRetryableLoader(
  () => import('@/screens/TrainingWorkspace'),
);
export const getPreparedTrainingWorkspace = loadTrainingWorkspace.getLoaded;
