import { reducedMotionMedia } from '@/lib/media-queries';
import { contourMedia, type ContourSources } from './contour-poster';

// A picture still needs an img when none of its sources match.
const emptyImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const desktopReduced = `${contourMedia.desktop} and ${reducedMotionMedia}`;
const desktopWithoutReduced = `${contourMedia.desktop} and (not ${reducedMotionMedia})`;

/** Keep the responsive image in place through shader readiness, failure and motion changes. */
export default function StaticContourPoster({
  sources,
  desktopFallback = false,
  withoutScripting = false,
}: {
  sources: ContourSources;
  desktopFallback?: boolean;
  withoutScripting?: boolean;
}) {
  const desktopMedia = withoutScripting
    ? desktopWithoutReduced
    : desktopFallback
      ? contourMedia.desktop
      : desktopReduced;
  const variants = withoutScripting ? (['desktop'] as const) : (['mobile', 'desktop'] as const);
  return (
    <picture className="hero-field-poster">
      {variants.map((variant) => {
        const { src, srcSet, sizes, width, height } = sources[variant];
        return (
          <source
            key={variant}
            media={variant === 'mobile' ? contourMedia.mobile : desktopMedia}
            srcSet={srcSet ?? src}
            sizes={sizes}
            width={width}
            height={height}
          />
        );
      })}
      <img
        src={emptyImage}
        width={sources.mobile.width}
        height={sources.mobile.height}
        fetchPriority="high"
        decoding="async"
        alt=""
      />
    </picture>
  );
}
