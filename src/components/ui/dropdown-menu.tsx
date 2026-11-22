'use client';

import type { ComponentProps, ReactElement } from 'react';
import { Menu as Primitive } from '@animate-ui/react/primitives/base-ui/menu';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { cn } from '@/lib/utils';
import { ActionFeedback } from './action-feedback';
import { MenuHighlight, MenuHighlightItem } from './menu-highlight';

type MenuPosition = Pick<Primitive.Positioner.Props, 'anchor' | 'sideOffset' | 'align'>;
const menuItemClass =
  'relative flex cursor-default items-center gap-2 rounded-xl text-sm outline-hidden select-none focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring forced-colors:focus-visible:[outline:auto] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4';
const choiceSpacing = 'px-2 py-1.5 aria-checked:font-semibold aria-checked:text-primary';

/** Retained exit content immediately loses keyboard and accessibility-tree participation. */
export function DropdownMenuContent({
  anchor,
  className,
  sideOffset = 4,
  align,
  selectedValue,
  children,
  ...props
}: Omit<Primitive.Popup.Props, 'render'> &
  MenuPosition & {
    selectedValue?: string;
    // Base UI 1.9 accepts false at runtime but omits initialFocus from Menu.Popup's types.
    initialFocus?: false;
  }) {
  return (
    <Primitive.Portal>
      <Primitive.Positioner
        anchor={anchor}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={0}
        positionMethod="fixed"
        className="z-50"
      >
        <Primitive.Popup
          {...props}
          data-slot="dropdown-menu-content"
          className={cn(
            'max-h-(--available-height) min-w-[8rem] max-w-[calc(100vw-2rem)] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none [&_[role^=menuitem]:not([data-disabled])]:opacity-100!',
            className,
          )}
          render={(surfaceProps, { open }) => (
            <div {...surfaceProps} inert={!open || undefined} aria-hidden={!open || undefined} />
          )}
        >
          <MenuHighlight current={selectedValue} insideAnimatedPopup>
            {children}
          </MenuHighlight>
        </Primitive.Popup>
      </Primitive.Positioner>
    </Primitive.Portal>
  );
}

export function DropdownMenuLinkItem({
  className,
  highlightValue,
  ...props
}: ComponentProps<typeof BaseMenu.LinkItem> & { highlightValue: string }) {
  return (
    <DropdownItemHighlight value={highlightValue}>
      <BaseMenu.LinkItem
        closeOnClick
        {...props}
        data-slot="dropdown-menu-item"
        className={cn(menuItemClass, 'px-2 py-1.5 aria-[current=page]:text-primary', className)}
      />
    </DropdownItemHighlight>
  );
}

export function DropdownMenuRadioItem({
  className,
  children,
  value,
  ...props
}: Omit<ComponentProps<typeof BaseMenu.RadioItem>, 'value'> & { value: string }) {
  return (
    <DropdownItemHighlight value={value} disabled={props.disabled}>
      <BaseMenu.RadioItem
        closeOnClick
        value={value}
        {...props}
        data-slot="dropdown-menu-radio-item"
        className={cn(menuItemClass, choiceSpacing, className)}
      >
        {children}
      </BaseMenu.RadioItem>
    </DropdownItemHighlight>
  );
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  highlightValue,
  ...props
}: ComponentProps<typeof BaseMenu.CheckboxItem> & { highlightValue: string }) {
  return (
    <DropdownItemHighlight value={highlightValue} disabled={props.disabled}>
      <BaseMenu.CheckboxItem
        {...props}
        data-slot="dropdown-menu-checkbox-item"
        className={cn(menuItemClass, choiceSpacing, className)}
      >
        {children}
      </BaseMenu.CheckboxItem>
    </DropdownItemHighlight>
  );
}

/** Measure the row without its press transform. The control retains its own gesture target. */
function DropdownItemHighlight({
  value,
  disabled,
  children,
}: {
  value: string;
  disabled?: boolean;
  children: ReactElement;
}) {
  return (
    <MenuHighlightItem value={value}>
      <div className={disabled ? 'pointer-events-none' : undefined}>
        <ActionFeedback disabled={disabled}>{children}</ActionFeedback>
      </div>
    </MenuHighlightItem>
  );
}

export const DropdownMenuGroup = Primitive.Group;
export const DropdownMenuRadioGroup = Primitive.RadioGroup;

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof Primitive.GroupLabel>) {
  return (
    <Primitive.GroupLabel
      data-slot="dropdown-menu-label"
      className={cn('px-2 py-1.5 text-sm font-medium', className)}
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
