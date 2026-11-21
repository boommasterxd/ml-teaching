import type { ComponentProps } from 'react';
import StaticContourPoster from './StaticContourPoster';
import type { ContourSources } from './contour-poster';
import GlassArtworkPlaceholder from './GlassArtworkPlaceholder';

export default function ErrorGlassFrame({
  sources,
  children,
  keepInitialPoster,
  fallback = false,
  pending = false,
  ...props
}: ComponentProps<'div'> & {
  sources: ContourSources;
  keepInitialPoster?: boolean;
  fallback?: boolean;
  pending?: boolean;
}) {
  return (
    <div id="error-glass-art" className="error-glass-viewport" {...props}>
      <div className="hero-field-art">
        {keepInitialPoster ? (
          <StaticContourPoster sources={sources} preload={false} />
        ) : (
          <GlassArtworkPlaceholder sources={sources} fallback={fallback} pending={pending} />
        )}
        {children}
      </div>
    </div>
  );
}
