'use client';

import { useEffect, useState } from 'react';
import ErrorGlassFrame from './ErrorGlassFrame';
import { preloadContourPoster } from './contour-poster';
import { errorRingPosterImages } from './poster-assets';

type Artwork = typeof import('./ErrorGlassArtwork').default;

export default function AppErrorGlassArtwork() {
  const [Artwork, setArtwork] = useState<Artwork>();
  preloadContourPoster(errorRingPosterImages);

  useEffect(() => {
    let active = true;
    void import('./ErrorGlassArtwork').then(
      ({ default: Artwork }) => {
        if (active) setArtwork(() => Artwork);
      },
      () => {},
    );
    return () => {
      active = false;
    };
  }, []);

  return Artwork ? (
    <Artwork keepInitialPoster sources={errorRingPosterImages} />
  ) : (
    <div className="error-glass">
      <ErrorGlassFrame keepInitialPoster sources={errorRingPosterImages} />
      <div className="error-glass-controls" />
    </div>
  );
}
