'use client';

import { useEffect, useRef, useSyncExternalStore, type RefObject } from 'react';
import { Sun } from '../icons/sun';
import { Moon } from '../icons/moon';
import { Smartphone } from '../icons/smartphone';
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { isMediumViewport, subscribeToMediumViewport } from '@/lib/media-queries';
import { parseTheme } from '@/lib/theme';
import { useTheme } from './ThemeProvider';

export function ThemeMenu({
  trigger,
  opening,
}: {
  trigger: RefObject<HTMLButtonElement | null>;
  opening: 'hover' | 'first' | 'last' | null;
}) {
  const { preference, select, setRemember } = useTheme();
  const desktop = useSyncExternalStore(subscribeToMediumViewport, isMediumViewport, () => false);
  const lastItem = useRef<HTMLElement>(null);

  useEffect(() => {
    if (opening !== 'last') return;
    // The popup may mount after Base UI has processed the opening ArrowUp.
    const frame = requestAnimationFrame(() => {
      const button = trigger.current;
      const popupId = button?.getAttribute('aria-controls');
      const active = button?.ownerDocument.activeElement;
      if (
        active === button ||
        (popupId && button?.ownerDocument.getElementById(popupId)?.contains(active ?? null))
      ) {
        lastItem.current?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [opening, trigger]);

  const sideOffset = () => {
    const button = trigger.current;
    const value = button && getComputedStyle(button).getPropertyValue('--theme-menu-offset');
    return Number.parseFloat(value || '') || 12;
  };
  const headerAnchor = () => trigger.current?.closest('.site-header-inner') ?? trigger.current;

  return (
    <DropdownMenuContent
      initialFocus={opening === 'hover' ? false : undefined}
      anchor={desktop ? trigger : headerAnchor}
      align={desktop ? 'end' : 'center'}
      sideOffset={sideOffset}
      selectedValue={preference.selection}
      data-theme-menu=""
      aria-label="Darstellung einstellen"
    >
      <DropdownMenuGroup>
        <DropdownMenuLabel>Darstellung</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={preference.selection}
          onValueChange={(value) => {
            const theme = parseTheme(value);
            if (theme) select(theme);
          }}
        >
          <DropdownMenuRadioItem value="light">
            <Sun aria-hidden="true" />
            Hell
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon aria-hidden="true" />
            Dunkel
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Smartphone aria-hidden="true" />
            Systemeinstellung
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuCheckboxItem
          ref={lastItem}
          highlightValue="remember"
          checked={preference.remember}
          onCheckedChange={setRemember}
        >
          Auswahl für weitere Besuche auf diesem Gerät merken
        </DropdownMenuCheckboxItem>
      </DropdownMenuGroup>
      <p className="px-2 py-1.5 text-xs leading-relaxed text-muted-foreground">
        Ohne Merken gilt die Auswahl nur für diesen Aufruf.
      </p>
    </DropdownMenuContent>
  );
}
