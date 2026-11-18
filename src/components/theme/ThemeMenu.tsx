'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';
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

/** Mounted only after intent; Radix/Animate UI mount the actual portal only when opened. */
export function ThemeMenu({ trigger }: ThemeMenuProps) {
  const { preference, select, setRemember } = useTheme();
  const [sideOffset, setSideOffset] = useState(12);
  useLayoutEffect(() => {
    const button = trigger.current;
    if (!button) return;
    const updateOffset = () => {
      const offset = Number.parseFloat(
        getComputedStyle(button).getPropertyValue('--theme-menu-offset'),
      );
      if (Number.isFinite(offset)) setSideOffset(offset);
    };
    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, [trigger]);

  return (
    <DropdownMenuContent
      align="end"
      sideOffset={sideOffset}
      data-theme-menu=""
      aria-label="Darstellung einstellen"
      onEscapeKeyDown={() => trigger.current?.focus({ preventScroll: true })}
      onCloseAutoFocus={(event) => event.preventDefault()}
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
          checked={preference.remember}
          onCheckedChange={(checked) => setRemember(checked === true)}
          onSelect={(event) => event.preventDefault()}
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
