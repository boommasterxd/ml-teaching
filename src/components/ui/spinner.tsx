import type { ComponentProps } from 'react';
import { Loader2 } from '@/components/icons/loader2';
import { cn } from '@/lib/utils';

function Spinner({
  className,
  ...props
}: Omit<ComponentProps<typeof Loader2>, 'animate' | 'loop'>) {
  return (
    <Loader2
      data-slot="spinner"
      role="status"
      aria-label="Wird geladen"
      className={cn('size-4', className)}
      {...props}
      animate
      loop
    />
  );
}

export { Spinner };
