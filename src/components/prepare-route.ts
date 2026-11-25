import { learningPaths } from '@/lib/learning-paths';
import { belowMediumViewport, reducedMotionMedia } from '@/lib/media-queries';

/** Use the native route cache and prepare the destination's first-view imagery alongside it. */
export function prepareRoute(
  router: { prefetch: (href: string) => void },
  href: string,
  pathname = href,
) {
  router.prefetch(href);
  if (pathname === '/') {
    const poster = window.matchMedia(belowMediumViewport).matches
      ? 'mobile'
      : window.matchMedia(reducedMotionMedia).matches
        ? 'desktop'
        : null;
    if (poster)
      void import('./hero/poster-assets')
        .then(({ preloadHeroPoster }) => preloadHeroPoster(poster))
        .catch(() => {});
  }
  if (pathname === learningPaths.images)
    void import('./image-hero/hero-assets')
      .then(({ preloadImageHero }) => preloadImageHero())
      .catch(() => {});
}
