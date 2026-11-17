/** The renderer's first frame, reused as a theme-colored alpha mask without startup JavaScript. */
export default function StaticContourPoster() {
  return (
    <>
      <link
        rel="preload"
        as="image"
        crossOrigin="anonymous"
        href="/hero-contours-mobile.webp"
        media="(width < 48rem)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        crossOrigin="anonymous"
        href="/hero-contours.webp"
        media="(width >= 48rem)"
        fetchPriority="high"
      />
      <div className="hero-field-poster" aria-hidden="true" />
    </>
  );
}
