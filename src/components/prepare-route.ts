import { learningPaths } from '@/lib/learning-paths';

/** Use the native route cache and prepare the destination's first-view imagery alongside it. */
export function prepareRoute(
  router: { prefetch: (href: string) => void },
  href: string,
  pathname = href,
) {
  router.prefetch(href);
  if (pathname === '/')
    void import('./hero/poster-assets')
      .then(({ preloadHeroPoster }) => preloadHeroPoster())
      .catch(() => {});
  if (pathname === learningPaths.images)
    void import('./image-hero/hero-assets')
      .then(({ preloadImageHero }) => preloadImageHero())
      .catch(() => {});
}
