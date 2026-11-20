'use client';

import { Activity, useState } from 'react';
import { usePathname } from 'next/navigation';
import { learningPaths } from '@/lib/learning-paths';
import {
  headerLearningGroups,
  headerLegalLinks,
  type HeaderNavGroup,
  type HeaderNavLink,
} from '@/content/site-navigation';
import IntentLink from './IntentLink';
import { HeaderMenuPanel, HeaderMenuPopup } from './HeaderMenuPanel';
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

interface MenuProps {
  mobile?: boolean;
  pathname: string;
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

function HeaderMenu({ mobile, pathname }: MenuProps) {
  const menus = mobile ? mobileMenus : desktopMenus;
  const [open, setOpen] = useState<OpenMenu>({ pathname, value: null });
  if (open.pathname !== pathname) setOpen({ pathname, value: null });
  const value = open.pathname === pathname ? open.value : null;
  const current = mobile ? value : currentHeaderItem(pathname);
  const menuClass = mobile ? 'header-menu-mobile' : 'header-menu-desktop';
  return (
    <NavigationMenu
      value={value}
      onValueChange={(next) => setOpen({ pathname, value: next })}
      Popup={HeaderMenuPopup}
      mobilePopup={mobile}
      className={menuClass}
    >
      <NavigationMenuList current={current}>
        {!mobile && <HomeNavigationItem active={pathname === home.href} />}
        {menus.map(({ label, groups }) => (
          <NavigationMenuItem key={label} value={label}>
            <MenuHighlightItem value={label}>
              <NavigationMenuTrigger
                data-current-section={!mobile && current === label ? '' : undefined}
              >
                {label}
              </NavigationMenuTrigger>
            </MenuHighlightItem>
            <HeaderMenuPanel
              groups={groups}
              current={containsCurrentPage(groups, pathname) ? pathname : null}
            />
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export default function SiteNavigation() {
  const pathname = usePathname() ?? '';
  return (
    <>
      <Activity>
        <HeaderMenu pathname={pathname} />
      </Activity>
      <Activity>
        <HeaderMenu mobile pathname={pathname} />
      </Activity>
    </>
  );
}
