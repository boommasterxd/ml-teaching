'use client';

import { useCallback, useRef, type ComponentProps, type RefObject } from 'react';
import { NavigationMenu as Primitive } from '@animate-ui/react/primitives/base-ui/navigation-menu';
import { NavigationMenu as BaseNavigationMenu } from '@base-ui/react/navigation-menu';
import { cn } from '@/lib/utils';
import {
  NavigationMenuTriggerLabel,
  navigationMenuListStyle,
  navigationMenuTriggerStyle,
} from './navigation-menu-trigger';
import { MenuHighlight } from './menu-highlight';
import { ScrollFadeViewport } from './scroll-fade-viewport';

export function NavigationMenu({
  className,
  children,
  mobilePopup,
  onValueChange,
  ...props
}: Primitive.Root.Props<string> & {
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
      <HeaderMenuPopup root={root} mobile={mobilePopup} />
    </Primitive.Root>
  );
}

function HeaderMenuPopup({
  root,
  mobile,
}: {
  root: RefObject<HTMLDivElement | null>;
  mobile?: boolean;
}) {
  const mobileAnchor = useCallback(
    () => root.current?.closest('.site-header-inner') ?? null,
    [root],
  );
  return (
    <Primitive.Portal container={root}>
      <Primitive.Positioner
        className="header-menu-positioner"
        anchor={mobile ? mobileAnchor : undefined}
        positionMethod={mobile ? 'absolute' : 'fixed'}
        sideOffset={mobile ? 5 : 12}
        collisionAvoidance={{ side: 'none', align: 'none', fallbackAxisSide: 'none' }}
      >
        <Primitive.Popup
          render={<div />}
          className={cn('header-menu-panel', mobile && 'header-menu-panel-mobile')}
        >
          <ScrollFadeViewport render={<Primitive.Viewport />} className="header-menu-viewport" />
        </Primitive.Popup>
      </Primitive.Positioner>
    </Primitive.Portal>
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
        className={cn(navigationMenuListStyle, className)}
        {...props}
      />
    </MenuHighlight>
  );
}

export const NavigationMenuItem = Primitive.Item;
export const NavigationMenuContent = Primitive.Content;

export function firstNavigationMenuLink(trigger: HTMLButtonElement) {
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
      render={(triggerProps, { open }) => (
        <button {...triggerProps}>
          <NavigationMenuTriggerLabel open={open}>{children}</NavigationMenuTriggerLabel>
        </button>
      )}
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
    />
  );
}

export function NavigationMenuLink({ className, ...props }: Primitive.Link.Props) {
  return (
    <BaseNavigationMenu.Link
      className={cn(
        'control-focus block rounded-sm p-2 text-sm aria-[current=page]:font-semibold',
        className,
      )}
      {...props}
    />
  );
}
