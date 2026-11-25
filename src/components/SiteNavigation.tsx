'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEventHandler,
  type RefCallback,
} from 'react';
import { usePathname } from 'next/navigation';
import { learningPaths } from '@/lib/learning-paths';
import { isMediumViewport, subscribeToMediumViewport } from '@/lib/media-queries';
import {
  headerLearningGroups,
  headerLegalLinks,
  type HeaderNavGroup,
  type HeaderNavLink,
} from '@/content/site-navigation';
import IntentLink from './IntentLink';
import { loadHeaderMenu } from './header-menu-loader';
import { useMenuModule } from './use-menu-module';
import { useTrainingEntry } from './training/TrainingEntryContext';
import { MenuHighlightItem } from './ui/menu-highlight';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import {
  firstNavigationMenuLink,
  InitialNavigationMenuTrigger,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuListStyle,
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

interface MenuProps {
  mobile?: boolean;
  pathname: string;
  runtime: ReturnType<typeof useMenuModule<Awaited<ReturnType<typeof loadHeaderMenu>>>>;
  focusRef: RefCallback<HTMLDivElement>;
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

function findHeaderTrigger(control: HTMLElement, menuClass: string, label: string) {
  return control
    .closest(`.${menuClass}`)
    ?.querySelector<HTMLButtonElement>(`[data-header-control="${CSS.escape(label)}"]`);
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

function HeaderMenu({ mobile, pathname, runtime, focusRef }: MenuProps) {
  const menus = mobile ? mobileMenus : desktopMenus;
  const { module, failed, prepare } = runtime;
  const Groups = module?.HeaderMenuGroups;
  const pendingFocus = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState<OpenMenu>({ pathname, value: null });
  if (open.pathname !== pathname) setOpen({ pathname, value: null });
  const value = open.pathname === pathname ? open.value : null;
  const current = mobile ? value : currentHeaderItem(pathname);
  const menuClass = mobile ? 'header-menu-mobile' : 'header-menu-desktop';
  const trainingEntry = useTrainingEntry();
  const pendingInMenu = Boolean(trainingEntry?.pendingTrigger?.closest(`.${menuClass}`));

  function closeMenu() {
    pendingFocus.current = null;
    setOpen({ pathname, value: null });
  }

  useEffect(() => {
    if (!Groups || !value) return;
    const trigger = pendingFocus.current;
    pendingFocus.current = null;
    if (trigger && trigger.ownerDocument.activeElement === trigger)
      firstNavigationMenuLink(trigger)?.focus();
  }, [Groups, value]);

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
        pendingFocus.current = null;
        setOpen({ pathname, value: next });
        if (next) prepare();
      }}
      mobilePopup={mobile}
      className={menuClass}
    >
      <NavigationMenuList current={current}>
        {!mobile && <HomeNavigationItem active={pathname === home.href} />}
        {menus.map(({ label, groups }) => (
          <NavigationMenuItem key={label} value={label}>
            <MenuHighlightItem value={label}>
              <NavigationMenuTrigger
                data-header-control={label}
                data-current-section={!mobile && current === label ? '' : undefined}
                aria-busy={(value === label && !Groups && !failed) || undefined}
                onPointerEnter={prepare}
                onPointerDown={prepare}
                onFocus={prepare}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowDown' || value !== label || Groups || failed) return;
                  event.preventDefault();
                  event.preventBaseUIHandler();
                  pendingFocus.current = event.currentTarget;
                }}
              >
                {label}
              </NavigationMenuTrigger>
            </MenuHighlightItem>
            <NavigationMenuContent
              data-slot="navigation-menu-content"
              className="header-menu-content"
            >
              {Groups ? (
                <Groups
                  groups={groups}
                  current={containsCurrentPage(groups, pathname) ? pathname : null}
                  onCurrentDestination={(link) => {
                    if (pendingInMenu) trainingEntry?.cancelPendingEntry?.();
                    closeMenu();
                    findHeaderTrigger(link, menuClass, label)?.focus({ preventScroll: true });
                  }}
                  onTrainingEntry={(link) => ({
                    opener: findHeaderTrigger(link, menuClass, label) ?? null,
                    onReady: closeMenu,
                  })}
                />
              ) : (
                <HeaderMenuLoading
                  failed={failed}
                  onRetry={(event) => {
                    findHeaderTrigger(event.currentTarget, menuClass, label)?.focus({
                      preventScroll: true,
                    });
                    prepare();
                  }}
                />
              )}
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function HeaderMenuLoading({
  failed,
  onRetry,
}: {
  failed: boolean;
  onRetry: MouseEventHandler<HTMLButtonElement>;
}) {
  return failed ? (
    <Alert role="alert">
      <AlertDescription>Das Menü konnte nicht geladen werden.</AlertDescription>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Erneut versuchen
      </Button>
    </Alert>
  ) : (
    <span role="status" className="flex items-center gap-2 p-2 text-sm">
      <Spinner aria-hidden="true" /> Menü wird geladen.
    </span>
  );
}

function StaticHeaderMenu({
  mobile,
  pathname,
  focusRef,
}: Pick<MenuProps, 'mobile' | 'pathname' | 'focusRef'>) {
  const current = currentHeaderItem(pathname);
  const menuClass = mobile ? 'header-menu-mobile' : 'header-menu-desktop';
  return (
    <div className={`relative max-w-max ${menuClass}`} ref={focusRef}>
      <div className="menu-highlight-container">
        <ul className={navigationMenuListStyle} data-slot="navigation-menu-list">
          {!mobile && (
            <li>
              <IntentLink
                href={home.href}
                aria-current={pathname === home.href ? 'page' : undefined}
                className={navigationMenuTriggerStyle}
                data-header-control={home.href}
              >
                {home.label}
              </IntentLink>
            </li>
          )}
          {(mobile ? mobileMenus : desktopMenus).map(({ label }) => (
            <li key={label}>
              <InitialNavigationMenuTrigger
                data-header-control={label}
                data-current-section={!mobile && current === label ? '' : undefined}
              >
                {label}
              </InitialNavigationMenuTrigger>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function useHeaderFocus() {
  const previous = useRef<string | null>(null);
  return useCallback<RefCallback<HTMLDivElement>>((node) => {
    if (!node) return;
    if (previous.current !== null) {
      const controls = [...node.querySelectorAll<HTMLElement>('[data-header-control]')];
      const next = controls.find((control) => control.dataset.headerControl === previous.current);
      (next ?? controls.find((control) => control.tagName === 'BUTTON'))?.focus({
        preventScroll: true,
      });
      previous.current = null;
    }
    return () => {
      const active = node.ownerDocument.activeElement;
      if (!node.contains(active)) return;
      previous.current =
        active?.closest<HTMLElement>('[data-header-control]')?.dataset.headerControl ??
        node.querySelector<HTMLElement>('[data-header-control][aria-expanded="true"]')?.dataset
          .headerControl ??
        '';
    };
  }, []);
}

export default function SiteNavigation() {
  const pathname = usePathname() ?? '';
  const runtime = useMenuModule(loadHeaderMenu);
  const desktop = useSyncExternalStore(subscribeToMediumViewport, isMediumViewport, staticViewport);
  const focusRef = useHeaderFocus();
  return desktop === null ? (
    <>
      <StaticHeaderMenu pathname={pathname} focusRef={focusRef} />
      <StaticHeaderMenu mobile pathname={pathname} focusRef={focusRef} />
    </>
  ) : (
    <HeaderMenu
      key={desktop ? 'desktop' : 'mobile'}
      mobile={!desktop}
      pathname={pathname}
      runtime={runtime}
      focusRef={focusRef}
    />
  );
}

const staticViewport = () => null;
