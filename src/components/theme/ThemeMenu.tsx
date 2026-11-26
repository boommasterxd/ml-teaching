'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { Sun } from '../icons/sun';
import { Moon } from '../icons/moon';
import { Smartphone } from '../icons/smartphone';
import { Check } from '../icons/check';
import { X } from '../icons/x';
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

function ThemeMenuChoices({
  firstItem,
  lastItem,
  onThemeSelected,
}: {
  firstItem: RefObject<HTMLElement | null>;
  lastItem: RefObject<HTMLElement | null>;
  onThemeSelected: () => void;
}) {
  const { preference, select, setRemember } = useTheme();
  const RememberIcon = preference.remember ? Check : X;
  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuLabel>Darstellung</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={preference.selection}
          onValueChange={(value) => {
            const theme = parseTheme(value);
            if (!theme) return;
            select(theme);
            onThemeSelected();
          }}
        >
          <DropdownMenuRadioItem ref={firstItem} value="light">
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
          <RememberIcon aria-hidden="true" />
          Auswahl merken
        </DropdownMenuCheckboxItem>
      </DropdownMenuGroup>
    </>
  );
}

export function ThemeMenu({
  id,
  trigger,
  opening,
  onClose,
  onPointerEnter,
  onPointerLeave,
}: {
  id: string;
  trigger: RefObject<HTMLButtonElement | null>;
  opening: 'hover' | 'first' | 'last' | null;
  onClose: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}) {
  const desktop = useSyncExternalStore(subscribeToMediumViewport, isMediumViewport, () => false);
  const firstItem = useRef<HTMLElement>(null);
  const lastItem = useRef<HTMLElement>(null);
  const [capturedBy, setCapturedBy] = useState<ViewTransition | null>(null);

  function retainPositioner() {
    const wipe = document.activeViewTransition;
    if (!wipe?.types?.has('animate-ui-theme')) return;
    setCapturedBy(wipe);
    const release = () => setCapturedBy((current) => (current === wipe ? null : current));
    void wipe.finished.then(release, release);
  }

  useEffect(() => {
    if (!opening || opening === 'hover') return;
    // The permanent trigger sits outside the deferred Base UI root.
    const frame = requestAnimationFrame(() => {
      const button = trigger.current;
      if (!button || button.ownerDocument.activeElement !== button) return;
      const item = opening === 'last' ? lastItem.current : firstItem.current;
      item?.focus({ preventScroll: true });
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
    <DropdownMenu
      modal={false}
      highlightItemOnHover={false}
      open={opening !== null}
      onOpenChange={(open, details) => {
        if (open) return;
        const button = trigger.current;
        const target = details.event.target;
        if (
          details.reason === 'outside-press' &&
          target instanceof Node &&
          button?.contains(target)
        ) {
          details.cancel();
          return;
        }
        if (
          opening !== 'hover' &&
          (details.reason === 'escape-key' || details.reason === 'item-press')
        )
          button?.focus({ preventScroll: true });
        onClose();
      }}
    >
      <DropdownMenuContent
        id={id}
        initialFocus={false}
        finalFocus={false}
        anchor={desktop ? trigger : headerAnchor}
        align={desktop ? 'end' : 'center'}
        sideOffset={sideOffset}
        data-theme-menu=""
        data-theme-menu-captured={capturedBy ? '' : undefined}
        aria-label="Darstellung einstellen"
        keepMounted={Boolean(capturedBy)}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <ThemeMenuChoices
          firstItem={firstItem}
          lastItem={lastItem}
          onThemeSelected={retainPositioner}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
