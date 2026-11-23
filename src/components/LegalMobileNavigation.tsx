'use client';

import { useRef, useState } from 'react';
import type { LegalPage } from '@/content/site-navigation';
import { DeferredMenuLoadError } from './DeferredMenuLoadError';
import { ChevronDown } from './icons/chevron-down';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuTrigger } from './ui/dropdown-menu-trigger';
import { useMenuModule, usePendingMenuDismissal } from './use-menu-module';

type MenuContent = typeof import('./LegalMobileMenu').default;
let menuRequest: Promise<MenuContent> | undefined;
let loadedMenu: MenuContent | undefined;

function loadMenu() {
  menuRequest ??= import('./LegalMobileMenu')
    .then(({ default: Menu }) => {
      loadedMenu = Menu;
      return Menu;
    })
    .catch((error: unknown) => {
      menuRequest = undefined;
      throw error;
    });
  return menuRequest;
}

/** Keep the SSG trigger stable while the optional popup prepares. */
export default function LegalMobileNavigation({ selectedValue }: { selectedValue: LegalPage }) {
  const focusOnOpen = useRef(false);
  const [open, setOpen] = useState(false);
  const { module: Menu, failed, prepare } = useMenuModule(loadMenu, loadedMenu);
  const pending = open && !Menu && !failed;
  const { area, trigger } = usePendingMenuDismissal({
    active: open && !Menu,
    popupSelector: '[data-legal-mobile-menu]',
    onDismiss: () => setOpen(false),
  });

  return (
    <div ref={area} className="legal-mobile-navigation relative">
      <DropdownMenu
        modal={false}
        open={open}
        onOpenChange={(next, { event }) => {
          focusOnOpen.current =
            next &&
            (event instanceof KeyboardEvent ||
              (event instanceof MouseEvent && event.type === 'click' && event.detail === 0));
          setOpen(next);
          if (next) prepare();
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
        <DropdownMenuTrigger
          ref={trigger}
          render={<Button variant="outline" />}
          aria-busy={pending || undefined}
          onPointerEnter={prepare}
          onFocus={prepare}
          onPointerDown={prepare}
        >
          Informationen
          <ChevronDown data-icon="inline-end" aria-hidden="true" />
        </DropdownMenuTrigger>
        {Menu && <Menu selectedValue={selectedValue} />}
      </DropdownMenu>
      <span role="status" className="sr-only">
        {pending ? 'Informationsmenü wird geladen.' : ''}
      </span>
      {open && failed && (
        <DeferredMenuLoadError
          className="absolute top-full right-0 z-30 mt-2 w-60"
          message="Das Informationsmenü konnte nicht geladen werden."
          trigger={trigger}
          retry={prepare}
        />
      )}
    </div>
  );
}
