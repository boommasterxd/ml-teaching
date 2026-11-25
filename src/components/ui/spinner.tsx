'use client';

import type { ComponentProps } from 'react';
import { usePageVisible } from '@animate-ui/react/utils/use-page-visible';
import { LoaderPlayback } from '@/components/icons/animated-loader-circle';
import { Loader2 } from '@/components/icons/loader2';
import { cn } from '@/lib/utils';
import { useMotionPreference } from './use-motion-preference';

function Spinner({
  className,
  ...props
}: Omit<ComponentProps<typeof Loader2>, 'animate' | 'loop'>) {
  const pageVisible = usePageVisible();
  const { reduce } = useMotionPreference();
  const playback = reduce ? 'pulse' : 'default';

  return (
    <LoaderPlayback value={pageVisible && playback}>
      <Loader2
        data-slot="spinner"
        role="status"
        aria-label="Wird geladen"
        className={cn('size-4', className)}
        {...props}
      />
    </LoaderPlayback>
  );
}

export { Spinner };
