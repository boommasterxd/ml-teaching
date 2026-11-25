'use client';

import { useEffect } from 'react';
import { useDeferredModule } from '@/hooks/use-deferred-module';
import { createRetryableLoader } from '@/lib/create-retryable-loader';
import ErrorGlassFrame from './ErrorGlassFrame';
import { errorRingPosterImages } from './poster-assets';

const loadErrorArtwork = createRetryableLoader(() => import('./ErrorGlassArtwork'));

export default function AppErrorGlassArtwork() {
  const { module, prepare } = useDeferredModule(loadErrorArtwork);
  useEffect(() => {
    prepare();
  }, [prepare]);
  const Artwork = module?.default;
  return Artwork ? (
    <Artwork sources={errorRingPosterImages} initialPoster />
  ) : (
    <div className="error-glass">
      <ErrorGlassFrame sources={errorRingPosterImages} fallback onPointerEnter={prepare} />
      <div className="error-glass-controls" aria-hidden="true" />
    </div>
  );
}
