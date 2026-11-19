'use client';

import { useCallback, useState, type RefObject } from 'react';
import { AnimateIcon } from '@animate-ui/react/icons';
import { NavigationMenu as Primitive } from '@animate-ui/react/primitives/base-ui/navigation-menu';
import type { HeaderNavGroup, HeaderNavLink } from '@/content/site-navigation';
import { cn } from '@/lib/utils';
import IntentLink from './IntentLink';
import { ArrowRight } from './icons/arrow-right';
import { headerMenuIcons } from './site-navigation-icons';
import { Badge } from './ui/badge';
import { NavigationMenuLink } from './ui/navigation-menu';
import { MenuHighlight, MenuHighlightItem } from './ui/menu-highlight';

function Destination({ link, current }: { link: HeaderNavLink; current: string | null }) {
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
        active={current === link.href}
        className="header-menu-row"
        render={<IntentLink href={link.href} data-overview={link.id === 'hub' ? '' : undefined} />}
      >
        {contents}
        {link.id === 'hub' && <ArrowRight size={14} aria-hidden="true" />}
      </NavigationMenuLink>
    </AnimateIcon>
  );
}

function HeaderMenuGroups({
  groups,
  current,
}: {
  groups: readonly HeaderNavGroup[];
  current: string | null;
}) {
  return (
    <MenuHighlight current={current} insideAnimatedPopup>
      <div className="header-menu-groups">
        {groups.map(({ label, links }) => (
          <div key={label} className="header-menu-group">
            {label && groups.length > 1 && <p className="header-menu-label">{label}</p>}
            <ul aria-label={label || undefined}>
              {links.map((link) => {
                const destination = <Destination link={link} current={current} />;
                return (
                  <li key={link.href}>
                    {link.comingSoon ? (
                      destination
                    ) : (
                      <MenuHighlightItem value={link.href}>
                        <div>{destination}</div>
                      </MenuHighlightItem>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </MenuHighlight>
  );
}

export function HeaderMenuPanel({
  groups,
  current,
}: {
  groups: readonly HeaderNavGroup[];
  current: string | null;
}) {
  return (
    <Primitive.Content data-slot="navigation-menu-content" className="header-menu-content">
      <HeaderMenuGroups groups={groups} current={current} />
    </Primitive.Content>
  );
}

export function HeaderMenuPopup({
  root,
  mobile,
}: {
  root: RefObject<HTMLDivElement | null>;
  mobile?: boolean;
}) {
  const mobileAnchor = useCallback(() => root.current?.parentElement ?? null, [root]);
  return (
    <Primitive.Portal container={root}>
      <Primitive.Positioner
        className="header-menu-positioner"
        anchor={mobile ? mobileAnchor : undefined}
        // Keep the desktop offset parent stable from measurement to first paint.
        positionMethod={mobile ? 'absolute' : 'fixed'}
        sideOffset={mobile ? 5 : 12}
        collisionAvoidance={{ side: 'none', align: 'none', fallbackAxisSide: 'none' }}
      >
        <Primitive.Popup
          render={<div />}
          className={cn('header-menu-panel', mobile && 'header-menu-panel-mobile')}
        >
          <Primitive.Viewport className="header-menu-viewport" />
        </Primitive.Popup>
      </Primitive.Positioner>
    </Primitive.Portal>
  );
}
