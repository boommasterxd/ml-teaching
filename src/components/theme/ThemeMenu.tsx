'use client';

import type { RefObject } from 'react';
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
import { parseTheme } from '@/lib/theme';
import { useTheme } from './ThemeProvider';

export interface ThemeMenuProps {
  trigger: RefObject<HTMLButtonElement | null>;
}

/** Warmed after intent; Base UI and Animate UI own the portal's opening and exit. */
export function ThemeMenu({ trigger }: ThemeMenuProps) {
  const { preference, select, setRemember } = useTheme();
  const sideOffset = () => {
    const button = trigger.current;
    const value = button && getComputedStyle(button).getPropertyValue('--theme-menu-offset');
    return Number.parseFloat(value || '') || 12;
  };

  return (
    <DropdownMenuContent
      align="end"
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
