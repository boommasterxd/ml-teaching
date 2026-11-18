'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimateIcon } from '@animate-ui/react/icons';
import { Highlight, HighlightItem } from '@animate-ui/react/primitives/effects/highlight';
import { learningPaths } from '@/lib/learning-paths';
import {
  headerLearningGroups,
  headerLegalLinks,
  type HeaderNavGroup,
  type HeaderNavLink,
} from '@/content/site-navigation';
import IntentLink from './IntentLink';
import { ArrowRight } from './icons/arrow-right';
import { headerMenuIcons } from './site-navigation-icons';
import { Badge } from './ui/badge';
import {
  NavigationMenu,
  NavigationMenuContent,
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

function Destination({ link, pathname }: { link: HeaderNavLink; pathname: string }) {
  const [focused, setFocused] = useState(false);
  const Icon = headerMenuIcons[link.id];
  const contents = (
    <>
      <Icon size={16} aria-hidden="true" />
      <span>{link.label}</span>
    </>
  );
  if (link.comingSoon) {
    return (
      <span aria-disabled="true" className="header-menu-row text-sm text-muted-foreground">
        {contents}
        <Badge variant="secondary" lang="en">
          Coming Soon
        </Badge>
      </span>
    );
  }
  return (
    <AnimateIcon
      asChild
      animate={focused}
      animateOnHover
      animateOnTap
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <NavigationMenuLink
        asChild
        active={pathname === link.href}
        className="header-menu-row hover:bg-transparent"
      >
        <IntentLink href={link.href} data-overview={link.id === 'hub' ? '' : undefined}>
          {contents}
          {link.id === 'hub' && <ArrowRight size={14} aria-hidden="true" />}
        </IntentLink>
      </NavigationMenuLink>
    </AnimateIcon>
  );
}

function MenuGroups({ groups, pathname }: { groups: readonly HeaderNavGroup[]; pathname: string }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const current = containsCurrentPage(groups, pathname) ? pathname : null;
  return (
    <Highlight
      controlledItems
      value={hovered ?? focused ?? current}
      click={false}
      className="header-menu-highlight"
    >
      <div className="header-menu-groups">
        {groups.map(({ label, links }) => (
          <div key={label} className="header-menu-group">
            {label && groups.length > 1 && <p className="header-menu-label">{label}</p>}
            <ul aria-label={label || undefined}>
              {links.map((link) => {
                const destination = <Destination link={link} pathname={pathname} />;
                return link.comingSoon ? (
                  <li key={link.href}>{destination}</li>
                ) : (
                  <HighlightItem<'li'>
                    as="li"
                    key={link.href}
                    value={link.href}
                    className="isolate"
                    onPointerEnter={(event) => {
                      if (event.pointerType !== 'touch') setHovered(link.href);
                    }}
                    onPointerLeave={() => setHovered(null)}
                    onFocus={(event) => {
                      if (!event.target.matches(':focus-visible')) return;
                      setHovered(null);
                      setFocused(link.href);
                    }}
                    onBlur={() => setFocused(null)}
                  >
                    {destination}
                  </HighlightItem>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Highlight>
  );
}

interface MenuProps {
  mobile?: boolean;
  pathname: string;
}

function containsCurrentPage(groups: readonly HeaderNavGroup[], pathname: string) {
  return groups.some((group) => group.links.some((link) => link.href === pathname));
}

function HeaderMenu({ mobile, pathname }: MenuProps) {
  const menus = mobile ? mobileMenus : desktopMenus;
  const [open, setOpen] = useState({ pathname, value: '' });
  if (open.pathname !== pathname) setOpen({ pathname, value: '' });
  return (
    <NavigationMenu
      aria-label={undefined}
      value={open.pathname === pathname ? open.value : ''}
      onValueChange={(value) => setOpen({ pathname, value })}
      className={mobile ? 'header-menu-mobile' : 'header-menu-desktop'}
    >
      <NavigationMenuList>
        {!mobile && (
          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              active={pathname === home.href}
              className={navigationMenuTriggerStyle}
            >
              <IntentLink href={home.href}>{home.label}</IntentLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
        )}
        {menus.map(({ label, groups }) => (
          <NavigationMenuItem key={label} value={label}>
            <NavigationMenuTrigger
              data-current-section={
                !mobile && containsCurrentPage(groups, pathname) ? '' : undefined
              }
            >
              {label}
            </NavigationMenuTrigger>
            <NavigationMenuContent
              className={
                mobile ? 'header-menu-panel header-menu-panel-mobile' : 'header-menu-panel'
              }
              style={mobile ? undefined : { transformOrigin: 'top center' }}
            >
              <MenuGroups groups={groups} pathname={pathname} />
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export default function SiteNavigation() {
  const pathname = usePathname() ?? '/';
  return (
    <>
      <HeaderMenu pathname={pathname} />
      <HeaderMenu mobile pathname={pathname} />
    </>
  );
}
