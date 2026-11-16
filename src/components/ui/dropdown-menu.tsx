'use client';

import type { ComponentProps } from 'react';
import { DropdownMenu as Primitive } from '@animate-ui/react/primitives/radix-ui/dropdown-menu';
import { useIsPresent } from 'motion/react';
import { Check } from '../icons';
import { cn } from '@/lib/utils';
import { ActionFeedback } from './action-feedback';

function MenuSurface({ children, ...props }: ComponentProps<'div'>) {
  const present = useIsPresent();
  return (
    <div {...props} inert={!present || undefined} aria-hidden={!present || undefined}>
      {children}
    </div>
  );
}

/** Retained exit content immediately loses keyboard and accessibility-tree participation. */
export function DropdownMenuContent({
  className,
  children,
  sideOffset = 8,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        {...props}
        asChild
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-56 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg outline-none',
          className,
        )}
      >
        <MenuSurface>{children}</MenuSurface>
      </Primitive.Content>
    </Primitive.Portal>
  );
}

export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.RadioItem>) {
  return (
    <ActionFeedback disabled={props.disabled}>
      <Primitive.RadioItem
        className={cn(
          'relative flex min-h-11 cursor-default select-none items-center gap-2 rounded-lg py-2 pl-8 pr-3 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4',
          className,
        )}
        {...props}
      >
        <span className="absolute left-2 grid size-4 place-items-center">
          <Primitive.ItemIndicator>
            <Check aria-hidden="true" />
          </Primitive.ItemIndicator>
        </span>
        {children}
      </Primitive.RadioItem>
    </ActionFeedback>
  );
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.CheckboxItem>) {
  return (
    <ActionFeedback disabled={props.disabled}>
      <Primitive.CheckboxItem
        className={cn(
          'relative flex min-h-11 cursor-default select-none items-center gap-2 rounded-lg py-2 pl-8 pr-3 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          className,
        )}
        {...props}
      >
        <span className="absolute left-2 grid size-4 place-items-center">
          <Primitive.ItemIndicator>
            <Check aria-hidden="true" />
          </Primitive.ItemIndicator>
        </span>
        {children}
      </Primitive.CheckboxItem>
    </ActionFeedback>
  );
}

export const DropdownMenuGroup = Primitive.Group;
export const DropdownMenuRadioGroup = Primitive.RadioGroup;
export const DropdownMenuLabel = Primitive.Label;
export const DropdownMenuSeparator = Primitive.Separator;
