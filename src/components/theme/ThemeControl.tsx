'use client';

import { useEffect, useId, useRef, useState } from 'react';
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

type ThemeOpening = 'hover' | 'first' | 'last';

function useThemeMenuOpening() {
  const [opening, setOpening] = useState<ThemeOpening | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function stopHoverTimer() {
    window.clearTimeout(timer.current);
  }

  function openOnHover() {
    stopHoverTimer();
    timer.current = window.setTimeout(() => setOpening((current) => current ?? 'hover'), 50);
  }

  function closeOnHoverLeave() {
    stopHoverTimer();
    // Allow a pointer to cross the gap between the trigger and the portal.
    timer.current = window.setTimeout(() => {
      setOpening((current) => (current === 'hover' ? null : current));
    }, 140);
  }

  function activate(position: 'first' | 'last', toggle: boolean) {
    stopHoverTimer();
    setOpening((current) => (toggle && current && current !== 'hover' ? null : position));
  }

  function close() {
    stopHoverTimer();
    setOpening(null);
  }

  return { opening, openOnHover, stopHoverTimer, closeOnHoverLeave, activate, close };
}

function ThemeSwitch({ animate }: { animate: boolean }) {
  const { preference, select } = useTheme();
  const initial = preference.revision === 0;
  const label = useId();
  const MoonIcon = animate ? Moon : StaticMoon;
  const SunIcon = animate ? Sun : StaticSun;
  return (
    <>
      <span id={label} className="sr-only">
        Dunkle Darstellung
      </span>
      <Switch
        data-theme-switch=""
        data-theme-initial={initial || undefined}
        className="data-[size=default]:h-6 data-[size=default]:w-10 data-[size=default]:[&>[data-slot=switch-thumb]]:size-5"
        aria-labelledby={label}
        checked={preference.resolved === 'dark'}
        animateThumb={animate}
        onCheckedChange={(dark) => select(dark ? 'dark' : 'light')}
      >
        {preference.resolved === 'dark' ? (
          <MoonIcon aria-hidden="true" />
        ) : (
          <SunIcon className="theme-switch-initial-sun" aria-hidden="true" />
        )}
        {initial && <StaticMoon className="theme-switch-initial-moon" aria-hidden="true" />}
      </Switch>
    </>
  );
}

export function ThemeControl() {
  const [thumbReady, setThumbReady] = useState(false);
  const prepareThumb = () => setThumbReady(true);
  const menuId = useId();
  const { opening, openOnHover, stopHoverTimer, closeOnHoverLeave, activate, close } =
    useThemeMenuOpening();
  const { module, failed, prepare } = useMenuModule(loadThemeMenu);
  const Menu = module?.ThemeMenu;
  const open = opening !== null;
  const pending = open && !Menu && !failed;
  const { area, trigger } = usePendingMenuDismissal({
    active: open && !Menu,
    popupSelector: '[data-theme-menu]',
    restoreFocus: opening !== 'hover',
    onDismiss: close,
  });

  return (
    <div
      ref={area}
      className="relative flex shrink-0 items-center gap-2"
      onPointerEnter={prepareThumb}
      onPointerDown={prepareThumb}
      onFocus={prepareThumb}
    >
      <ThemeSwitch animate={thumbReady} />
      <Button
        ref={trigger}
        variant="ghost"
        size="icon-sm"
        tapScale={1}
        type="button"
        className="relative size-(--theme-trigger-size)"
        aria-label="Darstellung einstellen"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-busy={pending || undefined}
        aria-controls={open && Menu ? menuId : undefined}
        data-popup-open={open ? '' : undefined}
        onPointerEnter={(event) => {
          if (event.pointerType !== 'mouse') return;
          prepare();
          openOnHover();
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse' && !failed) closeOnHoverLeave();
        }}
        onPointerDown={prepare}
        onFocus={prepare}
        onClick={() => {
          prepare();
          activate('first', true);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
          event.preventDefault();
          prepare();
          activate(event.key === 'ArrowUp' ? 'last' : 'first', false);
        }}
      >
        <ChevronDown animate={open || undefined} aria-hidden="true" />
        {pending && <Spinner className="absolute end-0 top-0 size-3" aria-hidden="true" />}
      </Button>
      {Menu && (
        <Menu
          id={menuId}
          trigger={trigger}
          opening={opening}
          onClose={close}
          onPointerEnter={stopHoverTimer}
          onPointerLeave={closeOnHoverLeave}
        />
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
