'use client';

import { useId, type ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip as Primitive } from '@animate-ui/react/primitives/base-ui/tooltip';
import { motionTokens } from '@animate-ui/react/utils/motion';
import { getStrictContext } from '@animate-ui/react/utils/strict-context';

const tooltipTransition = { ...motionTokens.spring.pop, opacity: { duration: 0 } };
const tooltipArrowSize = 10;
const [TooltipContext, useTooltip] = getStrictContext<{ id: string; open: boolean }>('Tooltip');

export function TooltipProvider(props: ComponentProps<typeof Primitive.Provider>) {
  return <Primitive.Provider delay={0} {...props} />;
}

export function Tooltip({ open, triggerId, ...props }: Primitive.Root.Props & { open: boolean }) {
  const generatedId = useId();
  const id = triggerId ?? generatedId;
  return (
    <TooltipContext value={{ id, open }}>
      <Primitive.Root {...props} triggerId={id} open={open} />
    </TooltipContext>
  );
}

export function TooltipTrigger(props: ComponentProps<typeof Primitive.Trigger>) {
  const { id, open } = useTooltip();
  return (
    <Primitive.Trigger
      id={id}
      aria-describedby={open ? `${id}-description` : undefined}
      {...props}
    />
  );
}

type Position = Pick<Primitive.Positioner.Props, 'collisionPadding'> & { sideOffset?: number };

export function TooltipContent({
  className,
  sideOffset = 0,
  collisionPadding = 0,
  children,
  ...props
}: Omit<Primitive.Popup.Props, 'className' | 'render'> & Position & { className?: string }) {
  const { id } = useTooltip();
  return (
    <Primitive.Portal>
      <Primitive.Positioner
        className="z-50"
        positionMethod="fixed"
        sideOffset={sideOffset + tooltipArrowSize}
        collisionPadding={collisionPadding}
      >
        <Primitive.Popup
          {...props}
          id={`${id}-description`}
          role="tooltip"
          data-slot="tooltip-content"
          transition={tooltipTransition}
          className={cn(
            'w-fit max-w-[min(20rem,var(--available-width))] origin-(--transform-origin) rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background',
            className,
          )}
        >
          {children}
          <Primitive.Arrow className="group/tooltip-arrow size-2.5 data-uncentered:invisible data-[side=top]:-bottom-2.5 data-[side=bottom]:-top-2.5 data-[side=left]:-right-2.5 data-[side=right]:-left-2.5">
            <span className="block size-full rotate-45 rounded-[2px] bg-foreground group-data-[side=top]/tooltip-arrow:-translate-y-[calc(50%+2px)] group-data-[side=bottom]/tooltip-arrow:translate-y-[calc(50%+2px)] group-data-[side=left]/tooltip-arrow:-translate-x-[calc(50%+2px)] group-data-[side=right]/tooltip-arrow:translate-x-[calc(50%+2px)]" />
          </Primitive.Arrow>
        </Primitive.Popup>
      </Primitive.Positioner>
    </Primitive.Portal>
  );
}
