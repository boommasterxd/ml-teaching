'use client';

import { useState } from 'react';
import { ReducedMotionConfig } from '@animate-ui/react/utils/motion';
import Button from '@/components/Button';
import { Pause } from '@/components/icons/pause';
import { Play } from '@/components/icons/play';
import { useEntryViewportReady } from '@/components/ui/entry-policy';
import ErrorGlassFrame from './ErrorGlassFrame';
import type { ContourSources } from './contour-poster';
import { useGlassField } from './use-glass-field';

interface ErrorGlassArtworkProps {
  digits?: boolean;
  sources: ContourSources;
  keepInitialPoster?: boolean;
}

function ErrorGlassScene({ digits, sources, keepInitialPoster }: ErrorGlassArtworkProps) {
  const [paused, setPaused] = useState(false);
  const viewportReady = useEntryViewportReady();
  const {
    artwork,
    Field,
    available,
    inView,
    failed,
    reduce,
    rendered,
    pending,
    onRendered,
    onUnavailable,
    prepare,
  } = useGlassField(paused, viewportReady, keepInitialPoster);
  const stopped = paused || reduce;
  const Icon = stopped || failed ? Play : Pause;

  return (
    <div className="error-glass">
      <ErrorGlassFrame
        sources={sources}
        keepInitialPoster={keepInitialPoster}
        fallback={failed || (paused && !rendered)}
        pending={pending}
        ref={artwork}
        data-enhanced={(available && rendered) || undefined}
        data-paused={stopped || undefined}
        data-field-unavailable={failed || undefined}
        onPointerEnter={prepare}
      >
        {viewportReady && available && Field && (
          <Field
            paused={paused}
            inView={inView}
            shape={digits ? 'digits' : 'ring'}
            onUnavailable={onUnavailable}
            onRendered={onRendered}
          />
        )}
      </ErrorGlassFrame>
      <div className="error-glass-controls">
        <Button
          variant="outline"
          size="sm"
          aria-controls="error-glass-art"
          aria-pressed={paused}
          disabled={reduce || failed}
          onPointerEnter={prepare}
          onPointerDown={prepare}
          onFocus={prepare}
          onClick={() => setPaused((value) => !value)}
        >
          <Icon data-icon="inline-start" aria-hidden="true" />
          {failed
            ? 'Animation nicht verfügbar'
            : reduce
              ? 'Bewegung reduziert'
              : paused
                ? 'Animation fortsetzen'
                : 'Animation pausieren'}
        </Button>
      </div>
    </div>
  );
}

export default function ErrorGlassArtwork(props: ErrorGlassArtworkProps) {
  return (
    <ReducedMotionConfig>
      <ErrorGlassScene {...props} />
    </ReducedMotionConfig>
  );
}
