'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from './icons/chevron-down';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { DropdownMenu, DropdownMenuTrigger } from './ui/dropdown-menu-trigger';
import type { LegalPage } from './LegalNavigation';

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

function useMenuContent(open: boolean) {
  const [Menu, setMenu] = useState(() => loadedMenu);
  const [failed, setFailed] = useState(false);
  const requested = useRef(false);
  function prepare() {
    if (Menu || requested.current) return;
    requested.current = true;
    setFailed(false);
    void loadMenu().then(
      (loaded) => setMenu(() => loaded),
      () => {
        requested.current = false;
        setFailed(true);
      },
    );
  }
  return { Menu, pending: open && !Menu && !failed, failed, prepare };
}

/** Keep the SSG trigger stable while the optional popup prepares. */
export default function LegalMobileNavigation({ selectedValue }: { selectedValue: LegalPage }) {
  const area = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const focusOnOpen = useRef(false);
  const [open, setOpen] = useState(false);
  const { Menu, pending, failed, prepare } = useMenuContent(open);

  useEffect(() => {
    if (!open || Menu) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus({ preventScroll: true });
    };
    const outside = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element) || area.current?.contains(target)) return;
      // Base UI can focus the portaled popup before the pending listener is cleaned up.
      if (!target.closest('[data-legal-mobile-menu]')) setOpen(false);
    };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
    };
  }, [open, Menu]);

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
        <Alert role="alert" className="absolute top-full right-0 z-30 mt-2 w-60">
          <AlertDescription>Das Informationsmenü konnte nicht geladen werden.</AlertDescription>
          <Button
            variant="secondary"
            onClick={() => {
              trigger.current?.focus({ preventScroll: true });
              prepare();
            }}
          >
            Erneut versuchen
          </Button>
        </Alert>
      )}
    </div>
  );
}
