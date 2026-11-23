'use client';

import { useId, useState } from 'react';
import { Moon as StaticMoon, Sun as StaticSun } from 'lucide-react';
import { ChevronDown } from '../icons/chevron-down';
import { Moon } from '../icons/moon';
import { Sun } from '../icons/sun';
import Button from '../Button';
import { DeferredMenuLoadError } from '../DeferredMenuLoadError';
import { DropdownMenu, DropdownMenuTrigger } from '../ui/dropdown-menu-trigger';
import { Switch } from '../ui/switch';
import { Spinner } from '../ui/spinner';
import { useMenuModule, usePendingMenuDismissal } from '../use-menu-module';
import { loadThemeMenu } from './theme-menu-loader';
import { useTheme } from './ThemeProvider';

export function ThemeControl() {
  const { preference, select } = useTheme();
  const [thumbReady, setThumbReady] = useState(false);
  const prepareThumb = () => setThumbReady(true);
  const initial = preference.revision === 0;
  const label = useId();
  const [opening, setOpening] = useState<'hover' | 'first' | 'last' | null>(null);
  const { module, failed, prepare } = useMenuModule(loadThemeMenu);
  const Menu = module?.ThemeMenu;
  const open = opening !== null;
  const pending = open && !Menu && !failed;
  const { area, trigger } = usePendingMenuDismissal({
    active: open && !Menu && opening !== 'hover',
    popupSelector: '[data-theme-menu]',
    onDismiss: () => setOpening(null),
  });
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
      <DropdownMenu
        modal={false}
        open={open}
        onOpenChange={(next, details) => {
          const { event, reason } = details;
          if (next) {
            const position =
              event instanceof KeyboardEvent && event.key === 'ArrowUp' ? 'last' : 'first';
            setOpening(reason === 'trigger-hover' ? 'hover' : position);
            prepare();
          } else if (reason === 'trigger-hover' && opening !== 'hover') {
            // A queued hover close can arrive after keyboard or pointer activation.
            details.cancel();
          } else {
            setOpening(null);
          }
        }}
      >
        <DropdownMenuTrigger
          ref={trigger}
          render={<Button variant="ghost" size="icon-sm" tapScale={1} />}
          className="relative size-(--theme-trigger-size)"
          aria-label="Darstellung einstellen"
          aria-busy={pending || undefined}
          {...(!Menu && { 'aria-controls': undefined })}
          openOnHover
          delay={50}
          closeDelay={50}
          onPointerEnter={prepare}
          onFocus={prepare}
          onPointerDown={prepare}
        >
          <ChevronDown aria-hidden="true" />
          {pending && <Spinner className="absolute end-0 top-0 size-3" aria-hidden="true" />}
        </DropdownMenuTrigger>
        {Menu && <Menu trigger={trigger} opening={opening} />}
      </DropdownMenu>
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
