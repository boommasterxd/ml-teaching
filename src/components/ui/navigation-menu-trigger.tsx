'use client';

import type { ComponentProps, ReactNode } from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import { ChevronDown } from '../icons/chevron-down';

export const navigationMenuTriggerStyle =
  'control-focus header-menu-trigger group relative inline-flex min-h-8 w-max items-center justify-center rounded-full px-2.5 py-1 text-sm font-medium aria-[current=page]:font-semibold';
export const navigationMenuListStyle = 'group flex list-none items-center justify-center gap-1';

export function NavigationMenuTriggerLabel({
  children,
  open = false,
}: {
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <>
      {children}
      <ChevronDown
        size={28}
        animate={open}
        className="ml-1 size-3 group-data-popup-open:rotate-180"
        aria-hidden="true"
      />
    </>
  );
}

/** The initial trigger can render before a breakpoint-specific menu root is mounted. */
export function InitialNavigationMenuTrigger({
  children,
  ...props
}: ComponentProps<typeof BaseButton>) {
  return (
    <BaseButton
      type="button"
      aria-expanded={false}
      className={navigationMenuTriggerStyle}
      {...props}
    >
      <NavigationMenuTriggerLabel open={props['aria-expanded'] === true}>
        {children}
      </NavigationMenuTriggerLabel>
    </BaseButton>
  );
}
