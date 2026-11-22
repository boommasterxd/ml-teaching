'use client';

import { cn } from '@/lib/utils';
import { Progress as ProgressPrimitive } from '@animate-ui/react/primitives/base-ui/progress';

type ProgressProps = ProgressPrimitive.Root.Props & {
  indicatorTransition?: ProgressPrimitive.Indicator.Props['transition'];
};

function Progress({ className, value, indicatorTransition, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full bg-primary"
        transition={indicatorTransition}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
