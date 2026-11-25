import { createRetryableLoader } from '@/lib/create-retryable-loader';

export const loadSiteMenus = createRetryableLoader(() => import('./site-menu-runtime'));

export function prepareSiteMenus() {
  // Deliberate activation owns loading feedback and can retry a failed preparation.
  void loadSiteMenus().catch(() => undefined);
}
