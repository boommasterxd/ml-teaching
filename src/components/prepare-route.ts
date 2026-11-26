import { learningPaths } from '@/lib/learning-paths';
import { belowMediumViewport, reducedMotionMedia } from '@/lib/media-queries';

export function canPrepareNavigation() {
  const { connection } = navigator as Navigator & { connection?: { saveData?: boolean } };
  return connection?.saveData !== true;
}

/** Use the native route cache and prepare the destination's first-view imagery alongside it. */
export function prepareRoute(
  router: { prefetch: (href: string) => void },
  href: string,
  pathname = href,
) {
  if (!canPrepareNavigation()) return;
  router.prefetch(href);
  if (pathname === '/' && window.matchMedia(reducedMotionMedia).matches) {
    const variant = window.matchMedia(belowMediumViewport).matches ? 'mobile' : 'desktop';
    void import('./hero/poster-assets')
      .then(({ preloadHeroPoster }) => preloadHeroPoster(variant))
      .catch(() => {});
  }
  if (pathname === learningPaths.images)
    void import('./image-hero/hero-assets')
      .then(({ preloadImageHero }) => preloadImageHero())
      .catch(() => {});
}
