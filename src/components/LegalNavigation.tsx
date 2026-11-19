'use client';

import AnimatedLink from './AnimatedLink';
import Link from './IntentLink';
import LegalMobileNavigation from './LegalMobileNavigation';
import LegalBackLink from './LegalBackLink';
import { legalPageIcons } from './site-navigation-icons';
import { DropdownMenuLinkItem } from './ui/dropdown-menu';
import { Card } from './ui/card';
import { Text } from './ui/typography';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from './ui/navigation-menu';
import { EntryReveal } from './ui/entry-reveal';
import { MenuHighlightItem } from './ui/menu-highlight';
import { headerLegalLinks } from '@/content/site-navigation';

export type LegalPage = (typeof headerLegalLinks)[number]['id'];
const pages = headerLegalLinks.map((link) => ({ ...link, Icon: legalPageIcons[link.id] }));

export default function LegalNavigation({ page }: { page: LegalPage }) {
  return (
    <EntryReveal kind="navigation" asChild>
      <aside className="legal-sidebar">
        <LegalBackLink />
        <LegalMobileNavigation selectedValue={page}>
          {pages.map(({ id, href, label, Icon }) => (
            <DropdownMenuLinkItem
              key={id}
              highlightValue={id}
              className="legal-page-link min-h-11"
              render={<Link href={href} aria-current={page === id ? 'page' : undefined} />}
            >
              <Icon aria-hidden="true" />
              {label}
            </DropdownMenuLinkItem>
          ))}
        </LegalMobileNavigation>
        <div className="legal-navigation-group">
          <Text variant="muted">Informationen</Text>
          <Card as="nav" aria-label="Informationsseiten" className="legal-navigation p-1.5">
            <NavigationMenu orientation="vertical" className="block max-w-none">
              <NavigationMenuList current={page} className="flex-col items-stretch">
                {pages.map(({ id, href, label, Icon }) => (
                  <NavigationMenuItem key={id}>
                    <MenuHighlightItem value={id}>
                      <NavigationMenuLink
                        active={page === id}
                        className="legal-page-link flex w-full justify-start rounded-full px-3"
                        render={<AnimatedLink href={href} variant="ghost" />}
                      >
                        <Icon data-icon="inline-start" aria-hidden="true" />
                        {label}
                      </NavigationMenuLink>
                    </MenuHighlightItem>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </Card>
        </div>
      </aside>
    </EntryReveal>
  );
}
