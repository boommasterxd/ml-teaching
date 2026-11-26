'use client';

import { useState, type SyntheticEvent } from 'react';
import { Spinner } from '../ui/spinner';
import { preloadContourPoster, type ContourSources } from './contour-poster';
import StaticContourPoster from './StaticContourPoster';

export default function GlassArtworkPlaceholder({
  sources,
  fallback,
  loading,
  preloadMobile = true,
  shaderFirst = false,
}: {
  sources: ContourSources;
  fallback: boolean;
  loading: boolean;
  preloadMobile?: boolean;
  shaderFirst?: boolean;
}) {
  const [posterReady, setPosterReady] = useState(false);
  const showFallback = fallback || (shaderFirst && loading);
  if (!showFallback && posterReady) setPosterReady(false);

  function markPosterReady(event: SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    if (image.naturalWidth <= 1) return;
    const source = image.currentSrc;
    void image.decode().then(
      () => {
        if (image.isConnected && image.currentSrc === source) setPosterReady(true);
      },
      () => {},
    );
  }

  if (preloadMobile && !shaderFirst) preloadContourPoster(sources, 'mobile');
  return (
    <>
      <StaticContourPoster
        sources={sources}
        fallback={showFallback}
        shaderFirst={shaderFirst}
        onLoad={shaderFirst && showFallback ? markPosterReady : undefined}
      />
      <noscript>
        <StaticContourPoster sources={sources} shaderFirst={shaderFirst} withoutScripting />
      </noscript>
      {loading && !posterReady && (
        <div className="hero-field-loading">
          <Spinner aria-label="Grafik wird geladen" />
        </div>
      )}
    </>
  );
}
