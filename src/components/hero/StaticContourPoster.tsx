import { contourMedia, type ContourSources } from './contour-poster';

/** The first full-color glass frame is available before hydration and without WebGL. */
export default function StaticContourPoster({ sources }: { sources: ContourSources }) {
  const { mobile, desktop } = sources;
  return (
    <picture className="hero-field-poster">
      <source
        media={contourMedia.desktop}
        sizes={desktop.sizes}
        srcSet={desktop.srcSet ?? desktop.src}
        width={desktop.width}
        height={desktop.height}
      />
      <img {...mobile} fetchPriority="high" decoding="async" alt="" />
    </picture>
  );
}
