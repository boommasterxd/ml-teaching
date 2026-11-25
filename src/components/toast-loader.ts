import { createRetryableLoader } from '@/lib/create-retryable-loader';

export const loadToaster = createRetryableLoader(() => import('./ui/toast'));

export function prepareToastViewport() {
  void loadToaster().catch(() => {});
}
