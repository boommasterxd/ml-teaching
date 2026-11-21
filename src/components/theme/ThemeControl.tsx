'use client';

import { useId, useState } from 'react';
import { Moon as StaticMoon, Sun as StaticSun } from 'lucide-react';
import { ChevronDown } from '../icons/chevron-down';
import { Moon } from '../icons/moon';
import { Sun } from '../icons/sun';
import Button from '../Button';
import { DeferredMenuLoadError } from '../DeferredMenuLoadError';
import { Switch } from '../ui/switch';
import { Spinner } from '../ui/spinner';
import { useMenuModule, usePendingMenuDismissal } from '../use-menu-module';
import { loadThemeMenu } from './theme-menu-loader';
import { useTheme } from './ThemeProvider';

function useDeferredThemeMenu() {
  const [opening, setOpening] = useState<'first' | 'last' | null>(null);
  const { module, failed, prepare } = useMenuModule(loadThemeMenu);
  const Menu = module?.ThemeMenu;
  const open = opening !== null;
  const { area, trigger } = usePendingMenuDismissal({
    active: open && !Menu,
    popupSelector: '[data-theme-menu]',
    onDismiss: () => setOpening(null),
  });
  function activate(position: 'first' | 'last') {
    setOpening(open ? null : position);
    if (!open) prepare();
  }

  return { trigger, area, Menu, opening, open, failed, prepare, activate, setOpening };
}

export function ThemeControl() {
  const { preference, select } = useTheme();
  const [thumbReady, setThumbReady] = useState(false);
  const prepareThumb = () => setThumbReady(true);
  const initial = preference.revision === 0;
  const label = useId();
  const popupId = useId();
  const { trigger, area, Menu, opening, open, failed, prepare, activate, setOpening } =
    useDeferredThemeMenu();
  const pending = open && !Menu && !failed;
  const MoonIcon = thumbReady ? Moon : StaticMoon;
  const SunIcon = thumbReady ? Sun : StaticSun;

  return (
    <div
      ref={area}
      className="relative flex shrink-0 items-center gap-2"
      onPointerEnter={prepareThumb}
      onPointerDown={prepareThumb}
      onFocus={prepareThumb}
    >
      <span id={label} className="sr-only">
        Dunkle Darstellung
      </span>
      <Switch
        data-theme-switch=""
        data-theme-initial={initial || undefined}
        className="data-[size=default]:h-6 data-[size=default]:w-10 data-[size=default]:[&>[data-slot=switch-thumb]]:size-5"
        aria-labelledby={label}
        checked={preference.resolved === 'dark'}
        animateThumb={thumbReady}
        onCheckedChange={(dark) => select(dark ? 'dark' : 'light')}
      >
        {preference.resolved === 'dark' ? (
          <MoonIcon aria-hidden="true" />
        ) : (
          <SunIcon className="theme-switch-initial-sun" aria-hidden="true" />
        )}
        {initial && <StaticMoon className="theme-switch-initial-moon" aria-hidden="true" />}
      </Switch>
      <Button
        ref={trigger}
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-(--theme-trigger-size)"
        tapScale={1}
        aria-label="Darstellung einstellen"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open && Menu ? popupId : undefined}
        aria-busy={pending || undefined}
        onPointerEnter={prepare}
        onFocus={prepare}
        onPointerDown={prepare}
        onClick={() => activate('first')}
        onKeyDown={(event) => {
          if (open || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;
          event.preventDefault();
          activate(event.key === 'ArrowUp' ? 'last' : 'first');
        }}
      >
        {pending ? <Spinner aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
      </Button>
      {Menu && (
        <Menu id={popupId} trigger={trigger} opening={opening} close={() => setOpening(null)} />
      )}
      {pending && (
        <span role="status" className="sr-only">
          Darstellungsmenü wird geladen.
        </span>
      )}
      {open && failed && (
        <DeferredMenuLoadError
          className="absolute right-0 top-full mt-2 w-64"
          message="Das Darstellungsmenü konnte nicht geladen werden."
          trigger={trigger}
          retry={prepare}
        />
      )}
    </div>
  );
}
