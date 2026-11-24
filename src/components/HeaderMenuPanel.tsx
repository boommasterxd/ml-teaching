'use client';

import { useState } from 'react';
import { AnimateIcon } from '@animate-ui/react/icons';
import type { HeaderNavGroup, HeaderNavLink } from '@/content/site-navigation';
import IntentLink from './IntentLink';
import { ArrowRight } from './icons/arrow-right';
import { headerMenuIcons } from './site-navigation-icons';
import { Badge } from './ui/badge';
import { NavigationMenuLink } from './ui/navigation-menu';
import { MenuHighlight, MenuHighlightItem } from './ui/menu-highlight';
import type { TrainingEntryOptions } from './training/TrainingEntryContext';

interface TrainingEntryAction {
  onTrainingEntry?: (link: HTMLAnchorElement) => TrainingEntryOptions;
}

function Destination({
  link,
  current,
  onTrainingEntry,
}: { link: HeaderNavLink; current: string | null } & TrainingEntryAction) {
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
            href={link.href}
            data-overview={link.id === 'hub' ? '' : undefined}
            onTrainingEntry={link.id === 'training' ? onTrainingEntry : undefined}
            trainingIcon={link.id === 'training' ? { content: icon, position: 'start' } : undefined}
          />
        }
      >
        {link.id === 'training' ? <span>{link.label}</span> : contents}
        {link.id === 'hub' && <ArrowRight size={14} aria-hidden="true" />}
      </NavigationMenuLink>
    </AnimateIcon>
  );
}

export function HeaderMenuGroups({
  groups,
  current,
  onTrainingEntry,
}: {
  groups: readonly HeaderNavGroup[];
  current: string | null;
} & TrainingEntryAction) {
  return (
    <MenuHighlight current={current} insideAnimatedPopup>
      <div className="header-menu-groups">
        {groups.map(({ label, links }) => (
          <div key={label} className="header-menu-group">
            {label && groups.length > 1 && <p className="header-menu-label">{label}</p>}
            <ul aria-label={label || undefined}>
              {links.map((link) => {
                const destination = (
                  <Destination link={link} current={current} onTrainingEntry={onTrainingEntry} />
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
