'use client';

import { useRef, type ComponentProps, type ComponentType, type RefObject } from 'react';
import { NavigationMenu as Primitive } from '@animate-ui/react/primitives/base-ui/navigation-menu';
import { NavigationMenu as BaseNavigationMenu } from '@base-ui/react/navigation-menu';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MenuHighlight } from './menu-highlight';

export const navigationMenuTriggerStyle =
  'header-menu-trigger group relative inline-flex min-h-8 w-max items-center justify-center rounded-full px-2.5 py-1 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function NavigationMenu({
  className,
  children,
  Popup,
  mobilePopup,
  onValueChange,
  ...props
}: Primitive.Root.Props<string> & {
  Popup?: ComponentType<{ root: RefObject<HTMLDivElement | null>; mobile?: boolean }>;
  mobilePopup?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  return (
    <Primitive.Root
      render={<div ref={root} />}
      className={cn('relative max-w-max', className)}
      onValueChange={(value, details) => {
        onValueChange?.(value, details);
        const target = details.event.target;
        if (
          details.reason === 'escape-key' &&
          !details.isCanceled &&
          target instanceof Element &&
          target.closest('.header-menu-panel')
        ) {
          // Restore keyboard focus while the closing visual remains mounted.
          root.current
            ?.querySelector<HTMLButtonElement>('button[aria-expanded="true"]')
            ?.focus({ preventScroll: true });
        }
      }}
      {...props}
    >
      {children}
      {Popup && <Popup root={root} mobile={mobilePopup} />}
    </Primitive.Root>
  );
}

/** Apply Animate UI's list isolation through CSS for the static CSP. */
export function NavigationMenuList({
  className,
  current,
  ...props
}: ComponentProps<typeof BaseNavigationMenu.List> & { current?: string | null }) {
  return (
    <MenuHighlight current={current}>
      <BaseNavigationMenu.List
        data-slot="navigation-menu-list"
        className={cn('group flex list-none items-center justify-center gap-1', className)}
        {...props}
      />
    </MenuHighlight>
  );
}

export const NavigationMenuItem = Primitive.Item;

function firstNavigationMenuLink(trigger: HTMLButtonElement) {
  const id = trigger.getAttribute('aria-controls');
  if (!id) return null;
  return trigger.ownerDocument
    .getElementById(id)
    ?.querySelector<HTMLAnchorElement>('[data-slot="navigation-menu-content"][data-open] a[href]');
}

export function NavigationMenuTrigger({ children, onKeyDown, ...props }: Primitive.Trigger.Props) {
  return (
    <Primitive.Trigger
      type="button"
      render={(triggerProps) => <button {...triggerProps} />}
      className={navigationMenuTriggerStyle}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.baseUIHandlerPrevented || event.key !== 'ArrowDown')
          return;
        const first = firstNavigationMenuLink(event.currentTarget);
        if (first) {
          event.preventDefault();
          event.preventBaseUIHandler();
          first.focus();
        }
      }}
      {...props}
    >
      {children}
      <ChevronDown
        size={28}
        className="ml-1 size-3 motion-safe:transition-transform group-data-popup-open:rotate-180"
        aria-hidden="true"
      />
    </Primitive.Trigger>
  );
}

export function NavigationMenuLink({ className, ...props }: Primitive.Link.Props) {
  return (
    <BaseNavigationMenu.Link
      className={cn(
        'block rounded-sm p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:font-semibold',
        className,
      )}
      {...props}
    />
  );
}
