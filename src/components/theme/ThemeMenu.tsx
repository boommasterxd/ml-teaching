'use client';

import { useEffect, useSyncExternalStore, type RefObject } from 'react';
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
import { DropdownMenu } from '../ui/dropdown-menu-trigger';
import { isMediumViewport, subscribeToMediumViewport } from '@/lib/media-queries';
import { parseTheme } from '@/lib/theme';
import { useTheme } from './ThemeProvider';

interface ThemeMenuProps {
  id: string;
  trigger: RefObject<HTMLButtonElement | null>;
  opening: 'first' | 'last' | null;
  close: () => void;
}

/** Warmed after intent; Base UI and Animate UI own the portal's opening and exit. */
export function ThemeMenu({ id, trigger, opening, close }: ThemeMenuProps) {
  return (
    <DropdownMenu
      modal={false}
      open={opening !== null}
      onOpenChange={(open, details) => {
        if (open) return;
        if (
          details.reason === 'outside-press' &&
          details.event.target instanceof Node &&
          trigger.current?.contains(details.event.target)
        ) {
          details.cancel();
          return;
        }
        if (details.reason === 'escape-key' || details.reason === 'item-press') {
          trigger.current?.focus({ preventScroll: true });
        }
        close();
      }}
    >
      <ThemeChoices id={id} trigger={trigger} opening={opening} />
    </DropdownMenu>
  );
}

function ThemeChoices({ id, trigger, opening }: Omit<ThemeMenuProps, 'close'>) {
  const { preference, select, setRemember } = useTheme();
  const desktop = useSyncExternalStore(subscribeToMediumViewport, isMediumViewport, () => false);

  useEffect(() => {
    if (!opening) return;
    const frame = requestAnimationFrame(() => {
      const popup = document.getElementById(id);
      const active = document.activeElement;
      if (!popup || (active !== trigger.current && !popup.contains(active))) return;
      const items = popup.querySelectorAll<HTMLElement>('[role^="menuitem"]');
      items[opening === 'last' ? items.length - 1 : 0]?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [id, opening, trigger]);

  const sideOffset = () => {
    const button = trigger.current;
    const value = button && getComputedStyle(button).getPropertyValue('--theme-menu-offset');
    return Number.parseFloat(value || '') || 12;
  };
  const headerAnchor = () => trigger.current?.closest('.site-header-inner') ?? trigger.current;

  return (
    <DropdownMenuContent
      id={id}
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
