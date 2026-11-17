'use client';

import type { ComponentProps } from 'react';
import { DropdownMenu as Primitive } from '@animate-ui/react/primitives/radix-ui/dropdown-menu';
import { useIsPresent } from 'motion/react';
import { Check } from '../icons/check';
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
  sideOffset = 4,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        {...props}
        asChild
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] max-w-[calc(100vw-2rem)] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none [&_[role^=menuitem]:not([data-disabled])]:opacity-100!',
          className,
        )}
      >
        <MenuSurface>{children}</MenuSurface>
      </Primitive.Content>
    </Primitive.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }: ComponentProps<typeof Primitive.Item>) {
  return (
    <ActionFeedback disabled={props.disabled}>
      <Primitive.Item
        {...props}
        data-slot="dropdown-menu-item"
        className={cn(
          'relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground aria-[current=page]:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
          className,
        )}
      />
    </ActionFeedback>
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
        data-slot="dropdown-menu-radio-item"
        className={cn(
          'relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
          className,
        )}
        {...props}
      >
        <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
          <Primitive.ItemIndicator>
            <span aria-hidden="true" className="block size-2 rounded-full bg-current" />
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
        data-slot="dropdown-menu-checkbox-item"
        className={cn(
          'relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
          className,
        )}
        {...props}
      >
        <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
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
export const DropdownMenu = Primitive.Root;
export const DropdownMenuTrigger = Primitive.Trigger;

export function DropdownMenuLabel({
  className,
  inset,
  ...props
}: ComponentProps<typeof Primitive.Label> & { inset?: boolean }) {
  return (
    <Primitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn('px-2 py-1.5 text-sm font-medium data-[inset]:pl-8', className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof Primitive.Separator>) {
  return (
    <Primitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
}
