'use client';

import { cn } from '@/lib/utils';
import { Progress as ProgressPrimitive } from '@animate-ui/react/primitives/base-ui/progress';

function Progress({ className, value, ...props }: ProgressPrimitive.Root.Props) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator data-slot="progress-indicator" className="h-full bg-primary" />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
