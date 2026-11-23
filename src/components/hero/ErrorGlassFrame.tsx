import type { ComponentProps } from 'react';
import type { ContourSources } from './contour-poster';
import GlassArtworkPlaceholder from './GlassArtworkPlaceholder';

export default function ErrorGlassFrame({
  sources,
  children,
  fallback = false,
  pending = false,
  ...props
}: ComponentProps<'div'> & {
  sources: ContourSources;
  fallback?: boolean;
  pending?: boolean;
}) {
  return (
    <div id="error-glass-art" className="error-glass-viewport" {...props}>
      <div className="hero-field-art">
        <GlassArtworkPlaceholder sources={sources} fallback={fallback} pending={pending} />
        {children}
      </div>
    </div>
  );
}
