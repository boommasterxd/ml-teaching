'use client';

import { headerLegalLinks } from '@/content/site-navigation';
import AnimatedLink from './AnimatedLink';
import { legalPageIcons } from './site-navigation-icons';
import { MenuHighlightItem } from './ui/menu-highlight';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from './ui/navigation-menu';

export type LegalPage = (typeof headerLegalLinks)[number]['id'];
const pages = headerLegalLinks.map((link) => ({ ...link, Icon: legalPageIcons[link.id] }));

/** Compose the highlight and its link in the same client boundary so the item can attach its ref. */
export default function LegalNavigationLinks({ page }: { page: LegalPage }) {
  return (
    <NavigationMenu orientation="vertical" className="block max-w-none">
      <NavigationMenuList current={page} className="flex-col items-stretch">
        {pages.map(({ id, href, label, Icon }) => (
          <NavigationMenuItem key={id}>
            <MenuHighlightItem value={id}>
              <NavigationMenuLink
                active={page === id}
                className="legal-page-link flex w-full justify-start rounded-(--menu-highlight-radius) px-3"
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
  );
}
