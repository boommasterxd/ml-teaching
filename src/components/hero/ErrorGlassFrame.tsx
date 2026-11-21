import type { ComponentProps } from 'react';
import StaticContourPoster from './StaticContourPoster';
import type { ContourSources } from './contour-poster';
import GlassArtworkPlaceholder from './GlassArtworkPlaceholder';

type ArtworkState = 'loading' | 'rendered' | 'fallback';

export default function ErrorGlassFrame({
  sources,
  children,
  preload,
  artworkState,
  ...props
}: ComponentProps<'div'> & {
  sources: ContourSources;
  preload?: boolean;
  artworkState?: ArtworkState;
}) {
  return (
    <div id="error-glass-art" className="error-glass-viewport" {...props}>
      <div className="hero-field-art">
        {artworkState === undefined ? (
          <StaticContourPoster sources={sources} preload={preload} />
        ) : (
          <GlassArtworkPlaceholder
            sources={sources}
            fallback={artworkState === 'fallback'}
            pending={artworkState === 'loading'}
          />
        )}
        {children}
      </div>
    </div>
  );
}
