'use client';

import type { RefObject } from 'react';
import { Sun, Moon, Smartphone } from '../icons';
import { Alert, AlertDescription } from '../ui/alert';
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
  return (
    <DropdownMenuContent
      align="end"
      data-theme-menu=""
      aria-label="Darstellung einstellen"
      onEscapeKeyDown={() => trigger.current?.focus({ preventScroll: true })}
      onCloseAutoFocus={(event) => event.preventDefault()}
    >
      <DropdownMenuGroup>
        <DropdownMenuLabel className="block px-2 py-1.5 text-sm font-semibold">
          Darstellung
        </DropdownMenuLabel>
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
      <DropdownMenuSeparator className="my-2 h-px bg-border" />
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
      {preference.notice && (
        <Alert role="status">
          <AlertDescription>{preference.notice}</AlertDescription>
        </Alert>
      )}
    </DropdownMenuContent>
  );
}
