'use client';

import AnimatedLink from './AnimatedLink';
import Link from './IntentLink';
import LegalMobileNavigation from './LegalMobileNavigation';
import LegalBackLink from './LegalBackLink';
import LegalSelection from './LegalSelection';
import { legalPageIcons } from './site-navigation-icons';
import { DropdownMenuItem } from './ui/dropdown-menu';
import { Card } from './ui/card';
import { Text } from './ui/typography';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from './ui/navigation-menu';
import { EntryReveal } from './ui/entry-reveal';
import { headerLegalLinks } from '@/content/site-navigation';

export type LegalPage = (typeof headerLegalLinks)[number]['id'];
const pages = headerLegalLinks.map((link) => ({ ...link, Icon: legalPageIcons[link.id] }));

/** Compose the Radix slots with their link elements in the same client boundary. */
export default function LegalNavigation({ page }: { page: LegalPage }) {
  return (
    <EntryReveal kind="navigation" asChild>
      <aside className="legal-sidebar">
        <LegalBackLink />
        <LegalMobileNavigation>
          {pages.map(({ id, href, label, Icon }) => (
            <DropdownMenuItem key={id} asChild className="legal-page-link min-h-11">
              <Link href={href} aria-current={page === id ? 'page' : undefined}>
                <Icon aria-hidden="true" />
                {label}
              </Link>
            </DropdownMenuItem>
          ))}
        </LegalMobileNavigation>
        <div className="legal-navigation-group">
          <Text variant="muted">Informationen</Text>
          <Card asChild className="p-1.5">
            <nav aria-label="Informationsseiten" className="legal-navigation">
              <NavigationMenu
                orientation="vertical"
                aria-label={undefined}
                className="block max-w-none"
              >
                <NavigationMenuList className="flex-col items-stretch">
                  {pages.map(({ id, href, label, Icon }) => (
                    <NavigationMenuItem key={id}>
                      <NavigationMenuLink
                        asChild
                        active={page === id}
                        className="legal-page-link relative isolate flex w-full justify-start rounded-full px-3 focus-visible:bg-accent"
                      >
                        <AnimatedLink href={href} variant="ghost">
                          {page === id && <LegalSelection />}
                          <Icon data-icon="inline-start" aria-hidden="true" />
                          {label}
                        </AnimatedLink>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </nav>
          </Card>
        </div>
      </aside>
    </EntryReveal>
  );
}
