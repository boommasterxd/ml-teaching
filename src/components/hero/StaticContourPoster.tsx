import type { ReactEventHandler } from 'react';
import { reducedMotionMedia } from '@/lib/media-queries';
import { contourMedia, type ContourSources } from './contour-poster';

// A picture still needs an img when none of its sources match.
const emptyImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const withoutReducedMotion = `(not ${reducedMotionMedia})`;

/** Keep the responsive image in place through shader readiness, failure and motion changes. */
export default function StaticContourPoster({
  sources,
  fallback = false,
  shaderFirst = false,
  withoutScripting = false,
  onLoad,
}: {
  sources: ContourSources;
  fallback?: boolean;
  shaderFirst?: boolean;
  withoutScripting?: boolean;
  onLoad?: ReactEventHandler<HTMLImageElement>;
}) {
  // Error pages already offer the mobile source outside noscript.
  const variants =
    withoutScripting && !shaderFirst ? (['desktop'] as const) : (['mobile', 'desktop'] as const);
  return (
    <picture className="hero-field-poster">
      {variants.map((variant) => {
        const { src, srcSet, sizes, width, height } = sources[variant];
        const reducedOnly = !fallback && (shaderFirst || variant === 'desktop');
        const motion = withoutScripting
          ? withoutReducedMotion
          : reducedOnly
            ? reducedMotionMedia
            : '';
        const media = motion ? `${contourMedia[variant]} and ${motion}` : contourMedia[variant];
        return (
          <source
            key={variant}
            media={media}
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
        onLoad={onLoad}
      />
    </picture>
  );
}
