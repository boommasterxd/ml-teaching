'use client';

import { useEffect, useId, useRef, useState, type ComponentType } from 'react';
import { ChevronDown, Loader2, Moon, Sun } from '../icons';
import Button from '../Button';
import { Alert, AlertDescription } from '../ui/alert';
import { Switch } from '../ui/switch';
import { DropdownMenu, DropdownMenuTrigger } from '../ui/dropdown-menu';
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
  const label = useId();
  const { trigger, area, Menu, open, failed, prepare, changeOpen } = useDeferredThemeMenu();

  return (
    <div ref={area} className="relative flex shrink-0 items-center gap-2">
      <span id={label} className="sr-only">
        Dunkle Darstellung
      </span>
      <Switch
        data-theme-switch=""
        aria-labelledby={label}
        checked={preference.resolved === 'dark'}
        onCheckedChange={(dark) => select(dark ? 'dark' : 'light')}
      >
        {preference.resolved === 'dark' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
      </Switch>
      <DropdownMenu modal={false} open={open} onOpenChange={changeOpen}>
        <DropdownMenuTrigger asChild ref={trigger}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Darstellung einstellen"
            aria-busy={open && !Menu && !failed}
            onPointerEnter={prepare}
            onFocus={prepare}
            onPointerDown={prepare}
          >
            {open && !Menu && !failed ? (
              <Loader2 animate loop aria-hidden="true" />
            ) : (
              <ChevronDown aria-hidden="true" />
            )}
          </Button>
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
      {!open && preference.notice && (
        <span role="status" className="sr-only">
          {preference.notice}
        </span>
      )}
    </div>
  );
}
