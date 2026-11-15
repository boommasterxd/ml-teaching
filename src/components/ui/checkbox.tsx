'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check as CheckIcon } from '../icons';
import { Checkbox as CheckboxPrimitive } from '@animate-ui/react/primitives/radix-ui';

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer inline-flex size-5 shrink-0 items-center justify-center rounded border border-zinc-500 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-indigo-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
