'use client';

import { useRef, useState } from 'react';
import { AnimateIcon } from '@animate-ui/react/icons';
import type { HeaderNavGroup, HeaderNavLink } from '@/content/site-navigation';
import IntentLink from './IntentLink';
import { ArrowRight } from './icons/arrow-right';
import { headerMenuIcons } from './site-navigation-icons';
import { Badge } from './ui/badge';
import { NavigationMenuLink } from './ui/navigation-menu';
import { MenuHighlight, MenuHighlightItem } from './ui/menu-highlight';
import type { TrainingEntryOptions } from './training/TrainingEntryContext';

interface HeaderMenuActions {
  onCurrentDestination: (link: HTMLAnchorElement) => void;
  onTrainingEntry?: (link: HTMLAnchorElement) => TrainingEntryOptions;
}

function Destination({
  link,
  current,
  onCurrentDestination,
  onTrainingEntry,
}: { link: HeaderNavLink; current: string | null } & HeaderMenuActions) {
  const anchor = useRef<HTMLAnchorElement>(null);
  const [focused, setFocused] = useState(false);
  const Icon = headerMenuIcons[link.id];
  const icon = <Icon size={16} aria-hidden="true" />;
  const contents = (
    <>
      {icon}
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
        render={
          <IntentLink
            ref={anchor}
            href={link.href}
            data-overview={link.id === 'hub' ? '' : undefined}
            onNavigate={(event) => {
              const destination = anchor.current;
              if (!destination || destination.href !== window.location.href) return;
              event.preventDefault();
              onCurrentDestination(destination);
            }}
            onTrainingEntry={link.id === 'training' ? onTrainingEntry : undefined}
            navigationIcon={{ content: icon, position: 'start' }}
          />
        }
      >
        <span>{link.label}</span>
        {link.id === 'hub' && <ArrowRight size={14} aria-hidden="true" />}
      </NavigationMenuLink>
    </AnimateIcon>
  );
}

export function HeaderMenuGroups({
  groups,
  current,
  onCurrentDestination,
  onTrainingEntry,
}: {
  groups: readonly HeaderNavGroup[];
  current: string | null;
} & HeaderMenuActions) {
  return (
    <MenuHighlight current={current} insideAnimatedPopup>
      <div className="header-menu-groups">
        {groups.map(({ label, links }) => (
          <div key={label} className="header-menu-group">
            {label && groups.length > 1 && <p className="header-menu-label">{label}</p>}
            <ul aria-label={label || undefined}>
              {links.map((link) => {
                const destination = (
                  <Destination
                    link={link}
                    current={current}
                    onCurrentDestination={onCurrentDestination}
                    onTrainingEntry={onTrainingEntry}
                  />
                );
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
