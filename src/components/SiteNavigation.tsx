'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { learningPaths } from '@/lib/learning-paths';
import {
  headerLearningGroups,
  headerLegalLinks,
  type HeaderNavGroup,
  type HeaderNavLink,
} from '@/content/site-navigation';
import IntentLink from './IntentLink';
import { Button } from './ui/button';
import { Loader2 } from './icons/loader2';
import { Alert, AlertDescription } from './ui/alert';
import { MenuHighlightItem } from './ui/menu-highlight';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from './ui/navigation-menu';

const home: HeaderNavLink = { id: 'home', label: 'Startseite', href: '/' };
const hub: HeaderNavLink = { id: 'hub', label: 'Lernlabor-Übersicht', href: learningPaths.hub };
const legalGroup: HeaderNavGroup = { label: 'Rechtliches', links: headerLegalLinks };
const desktopMenus = [
  { label: 'Lernlabor', groups: [{ label: '', links: [hub] }, ...headerLearningGroups] },
  { label: 'Rechtliches', groups: [legalGroup] },
];
const mobileMenus = [
  {
    label: 'Menü',
    groups: [{ label: '', links: [home, hub] }, ...headerLearningGroups, legalGroup],
  },
];

type MenuModule = typeof import('./HeaderMenuPanel');
let menuModule: Promise<MenuModule> | undefined;

function useMenuPanels() {
  const [panels, setPanels] = useState<MenuModule>();
  const [failed, setFailed] = useState(false);
  const requested = useRef(false);
  function prepare() {
    if (requested.current) return;
    requested.current = true;
    setFailed(false);
    menuModule ??= import('./HeaderMenuPanel').catch((error: unknown) => {
      menuModule = undefined;
      throw error;
    });
    void menuModule.then(setPanels, () => {
      requested.current = false;
      setFailed(true);
    });
  }
  return { panels, failed, prepare };
}

interface MenuProps {
  mobile?: boolean;
  pathname: string;
  content: ReturnType<typeof useMenuPanels>;
}

interface OpenMenu {
  pathname: string;
  value: string | null;
}

function containsCurrentPage(groups: readonly HeaderNavGroup[], pathname: string) {
  return groups.some((group) => group.links.some((link) => link.href === pathname));
}

function currentHeaderItem(pathname: string) {
  if (pathname === home.href) return home.href;
  return desktopMenus.find(({ groups }) => containsCurrentPage(groups, pathname))?.label;
}

function HomeNavigationItem({ active }: { active: boolean }) {
  return (
    <NavigationMenuItem>
      <MenuHighlightItem value={home.href}>
        <NavigationMenuLink
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

function MenuLoadStatus({ failed, onRetry }: { failed: boolean; onRetry: () => void }) {
  if (!failed) {
    return (
      <p role="status" className="sr-only">
        Navigation wird geladen.
      </p>
    );
  }
  return (
    <Alert role="alert" className="absolute left-1/2 top-full mt-2 w-64 -translate-x-1/2">
      <AlertDescription>Das Menü konnte nicht geladen werden.</AlertDescription>
      <Button variant="secondary" onClick={onRetry}>
        Erneut versuchen
      </Button>
    </Alert>
  );
}

function useDismissPendingMenu(
  pending: boolean,
  menuClass: string,
  dismiss: (restoreFocus: boolean) => void,
) {
  useEffect(() => {
    if (!pending) return;
    // The native dismiss handlers attach when the lazy popup mounts.
    const outside = (event: Event) => {
      if (!(event.target instanceof Element) || !event.target.closest(`.${menuClass}`)) {
        dismiss(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) dismiss(true);
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [dismiss, menuClass, pending]);
}

function HeaderMenu({ mobile, pathname, content }: MenuProps) {
  const menus = mobile ? mobileMenus : desktopMenus;
  const { panels, failed, prepare } = content;
  const pendingFocus = useRef<HTMLButtonElement | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState<OpenMenu>({ pathname, value: null });
  if (open.pathname !== pathname) setOpen({ pathname, value: null });
  const value = open.pathname === pathname ? open.value : null;
  const current = mobile ? value : currentHeaderItem(pathname);
  const loading = value !== null && !panels && !failed;
  const menuClass = mobile ? 'header-menu-mobile' : 'header-menu-desktop';
  const dismissPending = useCallback(
    (restoreFocus: boolean) => {
      pendingFocus.current = null;
      setOpen({ pathname, value: null });
      if (restoreFocus) opener.current?.focus({ preventScroll: true });
    },
    [pathname],
  );
  useDismissPendingMenu(value !== null && !panels, menuClass, dismissPending);
  const focusPanel = useCallback((element: HTMLElement | null) => {
    const trigger = pendingFocus.current;
    if (!element || !trigger) return;
    pendingFocus.current = null;
    if (trigger === element.ownerDocument.activeElement)
      element.querySelector<HTMLAnchorElement>('a[href]')?.focus();
  }, []);
  return (
    <NavigationMenu
      value={value}
      onValueChange={(next, { event, reason }) => {
        if (next) {
          if (!panels && event.target instanceof Element) {
            opener.current = event.target.closest('button.header-menu-trigger');
            if (reason === 'list-navigation') pendingFocus.current = opener.current;
          }
          prepare();
        } else pendingFocus.current = null;
        setOpen({ pathname, value: next });
      }}
      Popup={panels?.HeaderMenuPopup}
      mobilePopup={mobile}
      className={menuClass}
    >
      <NavigationMenuList current={current}>
        {!mobile && <HomeNavigationItem active={pathname === home.href} />}
        {menus.map(({ label, groups }) => (
          <NavigationMenuItem key={label} value={label}>
            <MenuHighlightItem value={label}>
              <NavigationMenuTrigger
                onPointerEnter={prepare}
                onFocus={prepare}
                onPointerDown={prepare}
                aria-busy={value === label && loading}
                onKeyDown={(event) => {
                  if (panels || value !== label || event.key !== 'ArrowDown') return;
                  pendingFocus.current = event.currentTarget;
                  event.preventDefault();
                  event.preventBaseUIHandler();
                }}
                data-current-section={!mobile && current === label ? '' : undefined}
              >
                {label}
                {value === label && loading && (
                  <Loader2 animate loop className="ml-1 size-3" aria-hidden="true" />
                )}
              </NavigationMenuTrigger>
            </MenuHighlightItem>
            {panels && (
              <panels.HeaderMenuPanel
                groups={groups}
                current={containsCurrentPage(groups, pathname) ? pathname : null}
                onMount={focusPanel}
              />
            )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
      {value && !panels && (
        <MenuLoadStatus
          failed={failed}
          onRetry={() => {
            opener.current?.focus({ preventScroll: true });
            prepare();
          }}
        />
      )}
    </NavigationMenu>
  );
}

export default function SiteNavigation() {
  const pathname = usePathname() ?? '';
  const content = useMenuPanels();
  return (
    <>
      <HeaderMenu pathname={pathname} content={content} />
      <HeaderMenu mobile pathname={pathname} content={content} />
    </>
  );
}
