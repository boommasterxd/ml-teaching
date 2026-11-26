import type { ComponentProps } from 'react';
import type { ContourSources } from './contour-poster';
import GlassArtworkPlaceholder from './GlassArtworkPlaceholder';

export default function ErrorGlassFrame({
  sources,
  children,
  fallback = false,
  loading = false,
  preloadMobile,
  ...props
}: ComponentProps<'div'> & {
  sources: ContourSources;
  fallback?: boolean;
  loading?: boolean;
  preloadMobile?: boolean;
}) {
  return (
    <div id="error-glass-art" className="error-glass-viewport" {...props}>
      <div className="hero-field-art">
        <GlassArtworkPlaceholder
          sources={sources}
          fallback={fallback}
          loading={loading}
          preloadMobile={preloadMobile}
        />
        {children}
      </div>
    </div>
  );
}
