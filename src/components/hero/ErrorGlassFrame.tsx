import type { ComponentProps } from 'react';
import StaticContourPoster from './StaticContourPoster';
import { errorDigitsPosterImages, errorRingPosterImages } from './poster-assets';

export default function ErrorGlassFrame({
  digits,
  children,
  ...props
}: ComponentProps<'div'> & { digits: boolean }) {
  return (
    <div id="error-glass-art" className="error-glass-viewport" {...props}>
      <div className="hero-field-art">
        <StaticContourPoster sources={digits ? errorDigitsPosterImages : errorRingPosterImages} />
        {children}
      </div>
    </div>
  );
}
