'use client';

import { useEffect, useId, useRef, useState, type ComponentType } from 'react';
import { Moon as InitialMoon } from 'lucide-react';
import { ChevronDown } from '../icons/chevron-down';
import { Moon } from '../icons/moon';
import { Sun } from '../icons/sun';
import Button from '../Button';
import { Alert, AlertDescription } from '../ui/alert';
import { Switch } from '../ui/switch';
import { DropdownMenu, DropdownMenuTrigger } from '../ui/dropdown-menu-trigger';
import { Spinner } from '../ui/spinner';
import { loadThemeMenu } from './theme-menu-loader';
import type { ThemeMenuProps } from './ThemeMenu';
import { useTheme } from './ThemeProvider';

function useDeferredThemeMenu() {
  const trigger = useRef<HTMLButtonElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const [Menu, setMenu] = useState<ComponentType<ThemeMenuProps> | null>(null);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const prepare = () => {
    setFailed(false);
    void loadThemeMenu()
      .then((module) => {
        if (mounted.current) setMenu(() => module.ThemeMenu);
      })
      .catch(() => {
        if (mounted.current) setFailed(true);
      });
  };
  const changeOpen = (next: boolean) => {
    if (!next && (document.activeElement as HTMLElement | null)?.closest('[data-theme-menu]'))
      trigger.current?.focus({ preventScroll: true });
    setOpen(next);
    if (next && !Menu) prepare();
  };
  useEffect(() => {
    if (!open || Menu) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !area.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', outside);
    };
  }, [open, Menu]);

  return { trigger, area, Menu, open, failed, prepare, changeOpen };
}

export function ThemeControl() {
  const { preference, select } = useTheme();
  const initial = preference.revision === 0;
  const label = useId();
  const { trigger, area, Menu, open, failed, prepare, changeOpen } = useDeferredThemeMenu();

  return (
    <div ref={area} className="relative flex shrink-0 items-center gap-2">
      <span id={label} className="sr-only">
        Dunkle Darstellung
      </span>
      <Switch
        data-theme-switch=""
        data-theme-initial={initial || undefined}
        className="data-[size=default]:h-6 data-[size=default]:w-10 data-[size=default]:[&>[data-slot=switch-thumb]]:size-5"
        aria-labelledby={label}
        checked={preference.resolved === 'dark'}
        onCheckedChange={(dark) => select(dark ? 'dark' : 'light')}
      >
        {preference.resolved === 'dark' ? (
          <Moon aria-hidden="true" />
        ) : (
          <Sun className="theme-switch-initial-sun" aria-hidden="true" />
        )}
        {initial && <InitialMoon className="theme-switch-initial-moon" aria-hidden="true" />}
      </Switch>
      <DropdownMenu modal={false} open={open} onOpenChange={changeOpen}>
        <DropdownMenuTrigger
          ref={trigger}
          render={<Button variant="ghost" size="icon-sm" tapScale={1} />}
          aria-label="Darstellung einstellen"
          aria-busy={open && !Menu && !failed}
          onPointerEnter={prepare}
          onFocus={prepare}
          onPointerDown={prepare}
        >
          {open && !Menu && !failed ? (
            <Spinner aria-hidden="true" />
          ) : (
            <ChevronDown aria-hidden="true" />
          )}
        </DropdownMenuTrigger>
        {Menu && <Menu trigger={trigger} />}
      </DropdownMenu>
      {open && !Menu && !failed && (
        <span role="status" className="sr-only">
          Darstellungsmenü wird geladen.
        </span>
      )}
      {open && failed && (
        <Alert className="absolute right-0 top-full mt-2 w-64" role="alert">
          <AlertDescription>Das Darstellungsmenü konnte nicht geladen werden.</AlertDescription>
          <Button variant="secondary" onClick={prepare}>
            Erneut versuchen
          </Button>
        </Alert>
      )}
    </div>
  );
}
