'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip as TooltipPrimitive } from '@animate-ui/react/primitives/radix-ui';
import { motionTokens } from '@animate-ui/react/utils/motion';
import { useIsPresent } from 'motion/react';

const tooltipTransition = { ...motionTokens.spring.pop, opacity: { duration: 0 } };

/** Keep portalled exit content out of interaction and the accessibility tree. */
function TooltipSurface(props: React.ComponentProps<'div'>) {
  const present = useIsPresent();
  return (
    <div
      {...props}
      aria-hidden={!present || props['aria-hidden'] || undefined}
      inert={!present || props.inert || undefined}
    />
  );
}

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: Omit<React.ComponentProps<typeof TooltipPrimitive.Content>, 'asChild'>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        asChild
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        transition={tooltipTransition}
        className={cn(
          'z-50 w-fit max-w-[min(20rem,var(--radix-tooltip-content-available-width))] origin-(--radix-tooltip-content-transform-origin) rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background',
          className,
        )}
        {...props}
      >
        <TooltipSurface>
          {children}
          <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
        </TooltipSurface>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
