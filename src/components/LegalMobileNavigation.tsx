'use client';

import { useEffect, useState } from 'react';
import type { LegalPage } from '@/content/site-navigation';
import { createRetryableLoader } from '@/lib/create-retryable-loader';
import { isLargeViewport, subscribeToLargeViewport } from '@/lib/media-queries';
import { DeferredMenuLoadError } from './DeferredMenuLoadError';
import { ChevronDown } from './icons/chevron-down';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuTrigger } from './ui/dropdown-menu-trigger';
import { Spinner } from './ui/spinner';
import { useMenuActivationFocus, useMenuModule, usePendingMenuDismissal } from './use-menu-module';

const loadMenu = createRetryableLoader(async () => (await import('./LegalMobileMenu')).default);

function isSameTabPageChange(event: KeyboardEvent | MouseEvent) {
  if (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    (event instanceof MouseEvent && event.button !== 0) ||
    !(event.target instanceof Element)
  )
    return false;

  const link = event.target.closest<HTMLAnchorElement>('a[href]');
  return (
    link !== null &&
    link.origin === window.location.origin &&
    link.pathname !== window.location.pathname &&
    (!link.target || link.target === '_self') &&
    !link.hasAttribute('download')
  );
}

function transferMenuFocus(area: HTMLDivElement | null) {
  const focused = area?.ownerDocument.activeElement;
  if (!(focused instanceof HTMLAnchorElement) || !focused.closest('[data-legal-mobile-menu]'))
    return;
  const desktopLinks = area
    ?.closest('.legal-sidebar')
    ?.querySelectorAll<HTMLAnchorElement>('.legal-navigation a[href]');
  const destination = desktopLinks && [...desktopLinks].find((link) => link.href === focused.href);
  destination?.focus({ preventScroll: true });
}

/** Keep the SSG trigger stable while the optional popup prepares. */
export default function LegalMobileNavigation({ selectedValue }: { selectedValue: LegalPage }) {
  const [openPage, setOpenPage] = useState<LegalPage | null>(null);
  const open = openPage === selectedValue;
  if (openPage !== null && !open) setOpenPage(null);

  const { module: Menu, failed, prepare } = useMenuModule(loadMenu, loadMenu.getLoaded());
  const pending = open && !Menu && !failed;
  const { area, trigger } = usePendingMenuDismissal({
    active: open && !Menu,
    popupSelector: '[data-legal-mobile-menu]',
    onDismiss: () => setOpenPage(null),
  });
  useEffect(() => {
    if (!open) return;
    return subscribeToLargeViewport(() => {
      if (!isLargeViewport()) return;
      transferMenuFocus(area.current);
      setOpenPage(null);
    });
  }, [area, open]);

  const { trackMenuActivation, focusFirstHighlightedItem } = useMenuActivationFocus(trigger);

  return (
    <div ref={area} className="legal-mobile-navigation relative">
      <DropdownMenu
        modal={false}
        open={open}
        onOpenChange={(next, details) => {
          const { event, reason } = details;
          if (!next && reason === 'item-press' && isSameTabPageChange(event)) {
            // Keep the activated link available until the new page replaces this menu.
            details.cancel();
            return;
          }
          trackMenuActivation(next, event);
          setOpenPage(next ? selectedValue : null);
          if (next) prepare();
        }}
        onItemHighlighted={focusFirstHighlightedItem}
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
      <div className="absolute top-full right-0 z-30 mt-2 w-60" role="status">
        {pending && (
          <Alert role="presentation">
            <Spinner aria-hidden="true" />
            <AlertDescription>Informationsmenü wird geladen.</AlertDescription>
          </Alert>
        )}
      </div>
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
