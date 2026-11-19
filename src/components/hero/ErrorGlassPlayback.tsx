'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import { Pause } from '@/components/icons/pause';
import { Play } from '@/components/icons/play';
import { useEntryViewportReady } from '@/components/ui/entry-policy';
import ErrorGlassFrame from './ErrorGlassFrame';
import { useGlassField } from './use-glass-field';

export default function ErrorGlassPlayback({ digits }: { digits: boolean }) {
  const [paused, setPaused] = useState(false);
  const viewportReady = useEntryViewportReady();
  const {
    artwork,
    Field,
    available,
    failed,
    reduce,
    rendered,
    hasRendered,
    onRendered,
    onUnavailable,
    prepare,
  } = useGlassField(paused, viewportReady);
  const Icon = paused ? Play : Pause;

  return (
    <>
      <ErrorGlassFrame
        digits={digits}
        ref={artwork}
        data-enhanced={(available && rendered) || undefined}
        data-paused={paused || undefined}
        data-field-unavailable={failed || undefined}
        onPointerEnter={prepare}
      >
        {viewportReady && available && Field && (
          <Field
            paused={paused}
            shape={digits ? 'digits' : 'ring'}
            onUnavailable={onUnavailable}
            onRendered={onRendered}
          />
        )}
      </ErrorGlassFrame>
      <div className="error-glass-controls">
        {hasRendered && !failed && !reduce && (
          <Button
            variant="outline"
            size="sm"
            aria-controls="error-glass-art"
            onClick={() => setPaused((value) => !value)}
          >
            <Icon data-icon="inline-start" aria-hidden="true" />
            {paused ? 'Animation fortsetzen' : 'Animation pausieren'}
          </Button>
        )}
      </div>
    </>
  );
}
