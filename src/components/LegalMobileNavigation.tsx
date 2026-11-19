'use client';

import { useRef, type ReactNode } from 'react';
import { ChevronDown } from './icons/chevron-down';
import { Button } from './ui/button';
import { DropdownMenuContent, DropdownMenuGroup } from './ui/dropdown-menu';
import { DropdownMenu, DropdownMenuTrigger } from './ui/dropdown-menu-trigger';

/** Three static links reuse the menu primitives already loaded by the site header. */
export default function LegalMobileNavigation({
  children,
  selectedValue,
}: {
  children: ReactNode;
  selectedValue: string;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const focusOnOpen = useRef(false);
  return (
    <div className="legal-mobile-navigation">
      <DropdownMenu
        modal={false}
        onOpenChange={(open, { event }) => {
          focusOnOpen.current =
            open &&
            (event instanceof KeyboardEvent ||
              (event instanceof MouseEvent && event.type === 'click' && event.detail === 0));
        }}
        onItemHighlighted={(item) => {
          if (!focusOnOpen.current || !(item instanceof HTMLElement)) return;
          focusOnOpen.current = false;
          // Make the native initial highlight usable before the next arrow key.
          if (item.ownerDocument.activeElement === trigger.current) {
            item.focus({ preventScroll: true });
          }
        }}
      >
        <DropdownMenuTrigger ref={trigger} render={<Button variant="outline" />}>
          Informationen
          <ChevronDown data-icon="inline-end" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" selectedValue={selectedValue}>
          <DropdownMenuGroup>{children}</DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
