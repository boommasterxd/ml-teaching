'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import { Spinner } from '../ui/spinner';
import { preloadContourPoster, type ContourSources } from './contour-poster';
import StaticContourPoster from './StaticContourPoster';

const loadingDelayMs = 500;

export default function GlassArtworkPlaceholder({
  sources,
  fallback,
  pending,
  preloadMobile = true,
  shaderFirst = false,
}: {
  sources: ContourSources;
  fallback: boolean;
  pending: boolean;
  preloadMobile?: boolean;
  shaderFirst?: boolean;
}) {
  const [delayed, setDelayed] = useState(false);
  const [posterReady, setPosterReady] = useState(false);
  const waiting = pending && delayed;
  const showFallback = fallback || (shaderFirst && waiting);
  if (!pending && delayed) setDelayed(false);
  if (!showFallback && posterReady) setPosterReady(false);
  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => setDelayed(true), loadingDelayMs);
    return () => window.clearTimeout(timer);
  }, [pending]);

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
      {waiting && !posterReady && (
        <div className="hero-field-loading">
          <Spinner aria-label="Grafik wird geladen" />
        </div>
      )}
    </>
  );
}
