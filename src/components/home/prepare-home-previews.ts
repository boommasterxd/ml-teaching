import { createRetryableLoader } from '@/lib/create-retryable-loader';

export type HomePreviewRuntime = typeof import('./preview-runtime');

export const prepareHomePreviews = createRetryableLoader(() => import('./preview-runtime'));
