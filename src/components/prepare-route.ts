import { learningPaths } from '@/lib/learning-paths';
import { reducedMotionMedia } from '@/lib/media-queries';

/** Use the native route cache and prepare the destination's first-view imagery alongside it. */
export function prepareRoute(
  router: { prefetch: (href: string) => void },
  href: string,
  pathname = href,
) {
  router.prefetch(href);
  if (pathname === '/' && window.matchMedia(reducedMotionMedia).matches)
    void import('./hero/poster-assets')
      .then(({ preloadHeroPoster }) => preloadHeroPoster())
      .catch(() => {});
  if (pathname === learningPaths.images)
    void import('./image-hero/hero-assets')
      .then(({ preloadImageHero }) => preloadImageHero())
      .catch(() => {});
}
