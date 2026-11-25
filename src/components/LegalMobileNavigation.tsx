'use client';

import { useState } from 'react';
import type { LegalPage } from '@/content/site-navigation';
import { createRetryableLoader } from '@/lib/create-retryable-loader';
import { DeferredMenuLoadError } from './DeferredMenuLoadError';
import { ChevronDown } from './icons/chevron-down';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuTrigger } from './ui/dropdown-menu-trigger';
import { Spinner } from './ui/spinner';
import { useMenuActivationFocus, useMenuModule, usePendingMenuDismissal } from './use-menu-module';

const loadMenu = createRetryableLoader(async () => (await import('./LegalMobileMenu')).default);

/** Keep the SSG trigger stable while the optional popup prepares. */
export default function LegalMobileNavigation({ selectedValue }: { selectedValue: LegalPage }) {
  const [open, setOpen] = useState(false);
  const { module: Menu, failed, prepare } = useMenuModule(loadMenu, loadMenu.getLoaded());
  const pending = open && !Menu && !failed;
  const { area, trigger } = usePendingMenuDismissal({
    active: open && !Menu,
    popupSelector: '[data-legal-mobile-menu]',
    onDismiss: () => setOpen(false),
  });
  const { trackMenuActivation, focusFirstHighlightedItem } = useMenuActivationFocus(trigger);

  return (
    <div ref={area} className="legal-mobile-navigation relative">
      <DropdownMenu
        modal={false}
        open={open}
        onOpenChange={(next, { event }) => {
          trackMenuActivation(next, event);
          setOpen(next);
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
