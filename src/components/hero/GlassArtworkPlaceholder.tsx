'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '../ui/spinner';
import { preloadContourPoster, type ContourSources } from './contour-poster';
import StaticContourPoster from './StaticContourPoster';

const loadingDelayMs = 500;

function DelayedLoadingIndicator() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), loadingDelayMs);
    return () => window.clearTimeout(timer);
  }, []);

  return visible ? (
    <div className="hero-field-loading">
      <Spinner aria-label="Grafik wird geladen" />
    </div>
  ) : null;
}

export default function GlassArtworkPlaceholder({
  sources,
  fallback,
  pending,
}: {
  sources: ContourSources;
  fallback: boolean;
  pending: boolean;
}) {
  preloadContourPoster(sources, ['mobile']);
  return (
    <>
      <StaticContourPoster sources={sources} desktopFallback={fallback} />
      <noscript>
        <StaticContourPoster sources={sources} withoutScripting />
      </noscript>
      {pending && <DelayedLoadingIndicator />}
    </>
  );
}
