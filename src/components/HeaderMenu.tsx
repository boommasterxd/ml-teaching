'use client';

import { useEffect, useRef, useState, type RefCallback } from 'react';
import IntentLink from './IntentLink';
import { HeaderMenuGroups } from './HeaderMenuPanel';
import {
  containsCurrentPage,
  currentHeaderItem,
  findHeaderTrigger,
  headerMenus,
  home,
  type HeaderMenuOpening,
} from './header-menu-model';
import { useTrainingEntry } from './training/TrainingEntryContext';
import { MenuHighlightItem } from './ui/menu-highlight';
import {
  firstNavigationMenuLink,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './ui/navigation-menu';
import { navigationMenuTriggerStyle } from './ui/navigation-menu-trigger';

interface HeaderMenuProps {
  mobile: boolean;
  pathname: string;
  initialOpening: HeaderMenuOpening | null;
  focusRef: RefCallback<HTMLDivElement>;
}

function HomeNavigationItem({ active }: { active: boolean }) {
  return (
    <NavigationMenuItem>
      <MenuHighlightItem value={home.href}>
        <NavigationMenuLink
          data-header-control={home.href}
          active={active}
          className={navigationMenuTriggerStyle}
          render={<IntentLink href={home.href} />}
        >
          {home.label}
        </NavigationMenuLink>
      </MenuHighlightItem>
    </NavigationMenuItem>
  );
}

export function HeaderMenu({ mobile, pathname, initialOpening, focusRef }: HeaderMenuProps) {
  const [open, setOpen] = useState<{ pathname: string; value: string | null }>({
    pathname,
    value: null,
  });
  const handoff = useRef(initialOpening && { pathname, opening: initialOpening });
  if (open.pathname !== pathname) setOpen({ pathname, value: null });
  const value = open.pathname === pathname ? open.value : null;
  const current = mobile ? value : currentHeaderItem(pathname);
  const menuClass = mobile ? 'header-menu-mobile' : 'header-menu-desktop';
  const trainingEntry = useTrainingEntry();
  const pendingInMenu = Boolean(trainingEntry?.pendingTrigger?.closest(`.${menuClass}`));

  useEffect(() => {
    const pending = handoff.current;
    if (pending?.pathname !== pathname) {
      handoff.current = null;
      return;
    }
    // Mount the portal container before opening the queued popup.
    const frame = requestAnimationFrame(() => {
      if (handoff.current === pending) setOpen({ pathname, value: pending.opening.label });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    const opening = handoff.current?.opening;
    if (!opening || opening.label !== value) return;
    handoff.current = null;
    if (opening.reason !== 'first') return;
    const active = document.activeElement;
    if (!(active instanceof HTMLButtonElement) || active.dataset.headerControl !== value) return;
    const frame = requestAnimationFrame(() => {
      if (document.activeElement === active) firstNavigationMenuLink(active)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <NavigationMenu
      ref={focusRef}
      value={value}
      onValueChange={(next, details) => {
        if (pendingInMenu && details.reason === 'trigger-hover') {
          details.cancel();
          return;
        }
        if (pendingInMenu && next !== value) trainingEntry?.cancelPendingEntry?.();
        handoff.current = null;
        setOpen({ pathname, value: next });
      }}
      mobilePopup={mobile}
      className={menuClass}
    >
      <NavigationMenuList current={current}>
        {!mobile && <HomeNavigationItem active={pathname === home.href} />}
        {headerMenus(mobile).map(({ label, groups }) => (
          <NavigationMenuItem key={label} value={label}>
            <MenuHighlightItem value={label}>
              <NavigationMenuTrigger
                data-header-control={label}
                data-current-section={!mobile && current === label ? '' : undefined}
              >
                {label}
              </NavigationMenuTrigger>
            </MenuHighlightItem>
            <NavigationMenuContent
              data-slot="navigation-menu-content"
              className="header-menu-content"
            >
              <HeaderMenuGroups
                groups={groups}
                current={containsCurrentPage(groups, pathname) ? pathname : null}
                onCurrentDestination={(link) => {
                  if (pendingInMenu) trainingEntry?.cancelPendingEntry?.();
                  setOpen({ pathname, value: null });
                  const root = link.closest(`.${menuClass}`);
                  if (root) findHeaderTrigger(root, label)?.focus({ preventScroll: true });
                }}
                onTrainingEntry={(link) => {
                  const root = link.closest(`.${menuClass}`);
                  return {
                    opener: root ? findHeaderTrigger(root, label) : null,
                    onReady: () => setOpen({ pathname, value: null }),
                  };
                }}
              />
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
