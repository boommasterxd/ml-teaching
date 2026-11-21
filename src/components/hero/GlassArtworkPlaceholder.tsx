'use client';

import { reducedMotionMedia } from '@/lib/media-queries';
import { Spinner } from '../ui/spinner';
import { contourMedia, type ContourSources } from './contour-poster';
import StaticContourPoster from './StaticContourPoster';

// A picture needs an img fallback even when none of its media sources match.
const emptyImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/** Reserve the shader area with an initial indicator and a browser-selected still. */
export default function GlassArtworkPlaceholder({
  sources,
  fallback,
  pending,
}: {
  sources: ContourSources;
  fallback: boolean;
  pending: boolean;
}) {
  if (fallback) return <StaticContourPoster sources={sources} preload={false} />;

  return (
    <>
      <picture className="hero-field-poster">
        {(['desktop', 'mobile'] as const).map((variant) => {
          const image = sources[variant];
          return (
            <source
              key={variant}
              media={`${reducedMotionMedia} and ${contourMedia[variant]}`}
              srcSet={image.srcSet ?? image.src}
              sizes={image.sizes}
              width={image.width}
              height={image.height}
            />
          );
        })}
        <img src={emptyImage} alt="" width={sources.mobile.width} height={sources.mobile.height} />
      </picture>
      <noscript>
        <StaticContourPoster sources={sources} preload={false} />
      </noscript>
      {pending && (
        <div className="hero-field-loading">
          <Spinner aria-label="Grafik wird geladen" />
        </div>
      )}
    </>
  );
}
