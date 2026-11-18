'use client';

import { useCallback, useRef, type ComponentProps, type ReactNode } from 'react';
import { NavigationMenu as Primitive } from '@animate-ui/react/primitives/radix-ui/navigation-menu';
import { cn } from '@/lib/utils';
import { ChevronDown } from '../icons/chevron-down';
import { useControlHydrated } from './use-control-hydration';

export const navigationMenuTriggerStyle =
  'header-menu-trigger group relative inline-flex min-h-8 w-max items-center justify-center rounded-full px-2.5 py-1 text-sm font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent';

export function NavigationMenu({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root asChild {...props}>
      <div className={cn('relative max-w-max', className)}>{children}</div>
    </Primitive.Root>
  );
}

/** Radix positions its indicator track inline. Only mount it in the hydrated menu. */
export function NavigationMenuList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const hydrated = useControlHydrated();
  const focusIndex = useRef(-1);
  const listRef = useCallback(
    (list: HTMLUListElement | null) => {
      if (!list) return;
      const controls = list.querySelectorAll<HTMLElement>('button, a[href]');
      if (!hydrated) {
        return () => {
          focusIndex.current = Array.from(controls).findIndex(
            (item) => item === document.activeElement,
          );
        };
      }
      if (focusIndex.current >= 0 && document.activeElement === document.body) {
        controls[focusIndex.current]?.focus({ preventScroll: true });
      }
      focusIndex.current = -1;
    },
    [hydrated],
  );
  const List = hydrated ? Primitive.List : 'ul';
  return (
    <List
      ref={listRef}
      data-slot="inline-navigation-menu-list"
      className={cn('group flex list-none items-center justify-center gap-1', className)}
    >
      {children}
    </List>
  );
}

export const NavigationMenuItem = Primitive.Item;

export function NavigationMenuTrigger({
  children,
  ...props
}: ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger type="button" className={navigationMenuTriggerStyle} {...props}>
      {children}
      <ChevronDown
        className="ml-1 size-3 motion-safe:transition-transform group-data-[state=open]:rotate-180"
        aria-hidden="true"
      />
    </Primitive.Trigger>
  );
}

export function NavigationMenuContent({
  className,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        'absolute top-full z-50 mt-1.5 rounded-md border bg-popover p-2 text-popover-foreground shadow-md',
        className,
      )}
      {...props}
      onFocusOutside={(event) => {
        props.onFocusOutside?.(event);
        const { target, relatedTarget } = event.detail.originalEvent;
        // Inline links remain in document order when Shift+Tab returns to their
        // trigger. Detached viewports instead restore tab stops via a focus proxy.
        if (
          target instanceof Element &&
          relatedTarget instanceof Element &&
          target.getAttribute('aria-controls') ===
            relatedTarget.closest('[data-slot="navigation-menu-content"]')?.id
        )
          event.preventDefault();
      }}
    />
  );
}

export function NavigationMenuLink({ className, ...props }: ComponentProps<typeof Primitive.Link>) {
  return (
    <Primitive.Link
      className={cn(
        'block rounded-sm p-2 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:font-semibold',
        className,
      )}
      {...props}
    />
  );
}
