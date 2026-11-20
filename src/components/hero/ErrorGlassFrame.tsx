import type { ComponentProps } from 'react';
import StaticContourPoster from './StaticContourPoster';
import type { ContourSources } from './contour-poster';

export default function ErrorGlassFrame({
  sources,
  children,
  preload,
  ...props
}: ComponentProps<'div'> & { sources: ContourSources; preload?: boolean }) {
  return (
    <div id="error-glass-art" className="error-glass-viewport" {...props}>
      <div className="hero-field-art">
        <StaticContourPoster sources={sources} preload={preload} />
        {children}
      </div>
    </div>
  );
}
