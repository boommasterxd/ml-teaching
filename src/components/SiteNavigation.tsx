'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefCallback,
} from 'react';
import { usePathname } from 'next/navigation';
import { isMediumViewport, subscribeToMediumViewport } from '@/lib/media-queries';
import { currentHeaderItem, headerMenus, home, type HeaderMenuOpening } from './header-menu-model';
import IntentLink from './IntentLink';
import { canPrepareNavigation } from './prepare-route';
import { loadSiteMenus, prepareSiteMenus } from './site-menu-loader';
import { useMenuModule, usePendingMenuDismissal } from './use-menu-module';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import {
  InitialNavigationMenuTrigger,
  navigationMenuListStyle,
  navigationMenuTriggerStyle,
} from './ui/navigation-menu-trigger';

interface StaticHeaderMenuProps {
  mobile?: boolean;
  pathname: string;
  focusRef: RefCallback<HTMLDivElement>;
  opening?: HeaderMenuOpening | null;
  failed?: boolean;
  prepare?: () => void;
  activate?: (
    label: string,
    reason: HeaderMenuOpening['reason'],
    button: HTMLButtonElement,
  ) => void;
  dismissHover?: () => void;
  retry?: () => void;
}

function PendingHeaderMenu({ failed, retry }: { failed?: boolean; retry?: () => void }) {
  return (
    <div className="header-menu-bootstrap absolute top-full z-50 mt-2 w-60">
      {failed ? (
        <Alert role="alert">
          <AlertDescription>Das Menü konnte nicht geladen werden.</AlertDescription>
          <Button variant="secondary" size="sm" onClick={retry}>
            Erneut versuchen
          </Button>
        </Alert>
      ) : (
        <Alert role="status">
          <Spinner aria-hidden="true" />
          <AlertDescription>Menü wird geladen.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function StaticHeaderMenu({
  mobile,
  pathname,
  focusRef,
  opening,
  failed,
  prepare,
  activate,
  dismissHover,
  retry,
}: StaticHeaderMenuProps) {
  const current = currentHeaderItem(pathname);
  return (
    <div
      className={`relative max-w-max ${mobile ? 'header-menu-mobile' : 'header-menu-desktop'}`}
      ref={focusRef}
      onPointerLeave={dismissHover}
    >
      <div className="menu-highlight-container">
        <ul className={navigationMenuListStyle} data-slot="navigation-menu-list">
          {!mobile && (
            <li>
              <IntentLink
                href={home.href}
                aria-current={pathname === home.href ? 'page' : undefined}
                className={navigationMenuTriggerStyle}
                data-header-control={home.href}
              >
                {home.label}
              </IntentLink>
            </li>
          )}
          {headerMenus(mobile).map(({ label }) => (
            <li key={label}>
              <InitialNavigationMenuTrigger
                data-header-control={label}
                data-current-section={!mobile && current === label ? '' : undefined}
                aria-expanded={opening?.label === label}
                aria-busy={(opening?.label === label && !failed) || undefined}
                onFocus={prepare}
                onPointerDown={prepare}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse')
                    activate?.(label, 'hover', event.currentTarget);
                }}
                onClick={(event) => activate?.(label, 'press', event.currentTarget)}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowDown') return;
                  event.preventDefault();
                  activate?.(label, 'first', event.currentTarget);
                }}
              >
                {label}
              </InitialNavigationMenuTrigger>
              {opening?.label === label && <PendingHeaderMenu failed={failed} retry={retry} />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function useHeaderFocus() {
  const previous = useRef<string | null>(null);
  return useCallback<RefCallback<HTMLDivElement>>((node) => {
    if (!node) return;
    if (previous.current !== null) {
      const controls = [...node.querySelectorAll<HTMLElement>('[data-header-control]')];
      const next = controls.find((control) => control.dataset.headerControl === previous.current);
      (next ?? controls.find((control) => control.tagName === 'BUTTON'))?.focus({
        preventScroll: true,
      });
      previous.current = null;
    }
    return () => {
      const active = node.ownerDocument.activeElement;
      if (!node.contains(active)) return;
      previous.current =
        active?.closest<HTMLElement>('[data-header-control]')?.dataset.headerControl ??
        node.querySelector<HTMLElement>('[data-header-control][aria-expanded="true"]')?.dataset
          .headerControl ??
        '';
    };
  }, []);
}

function HeaderMenuViewport({
  desktop,
  pathname,
  focusRef,
  runtime,
}: {
  desktop: boolean;
  pathname: string;
  focusRef: RefCallback<HTMLDivElement>;
  runtime: ReturnType<typeof useMenuModule<Awaited<ReturnType<typeof loadSiteMenus>>>>;
}) {
  const [opening, setOpening] = useState<HeaderMenuOpening | null>(null);
  const [previousPath, setPreviousPath] = useState(pathname);
  if (previousPath !== pathname) {
    setPreviousPath(pathname);
    setOpening(null);
  }
  const { module, failed, prepare } = runtime;
  const { area, trigger: triggerRef } = usePendingMenuDismissal({
    active: Boolean(opening && !module),
    onDismiss: () => setOpening(null),
    popupSelector: '.header-menu-panel',
    restoreFocus: opening?.reason !== 'hover',
  });
  const Menu = module?.HeaderMenu;

  return (
    <div ref={area} className="contents">
      {Menu ? (
        <Menu mobile={!desktop} pathname={pathname} initialOpening={opening} focusRef={focusRef} />
      ) : (
        <StaticHeaderMenu
          mobile={!desktop}
          pathname={pathname}
          focusRef={focusRef}
          opening={opening}
          failed={failed}
          prepare={prepareSiteMenus}
          activate={(label, reason, button) => {
            prepare();
            triggerRef.current = button;
            setOpening((previous) => {
              if (previous?.label === label && previous.reason === 'press' && reason === 'press')
                return null;
              return { label, reason };
            });
          }}
          dismissHover={() =>
            setOpening((previous) => (previous?.reason === 'hover' ? null : previous))
          }
          retry={() => {
            triggerRef.current?.focus({ preventScroll: true });
            prepare();
          }}
        />
      )}
    </div>
  );
}

export default function SiteNavigation() {
  const pathname = usePathname() ?? '';
  const desktop = useSyncExternalStore(subscribeToMediumViewport, isMediumViewport, staticViewport);
  const focusRef = useHeaderFocus();
  const runtime = useMenuModule(loadSiteMenus);
  useEffect(() => {
    const touch = window.matchMedia('(any-pointer: coarse)');

    function prepareForTouch() {
      if (touch.matches && canPrepareNavigation()) prepareSiteMenus();
    }

    prepareForTouch();
    touch.addEventListener('change', prepareForTouch);
    return () => touch.removeEventListener('change', prepareForTouch);
  }, []);

  return desktop === null ? (
    <>
      <StaticHeaderMenu pathname={pathname} focusRef={focusRef} />
      <StaticHeaderMenu mobile pathname={pathname} focusRef={focusRef} />
    </>
  ) : (
    <HeaderMenuViewport
      key={desktop ? 'desktop' : 'mobile'}
      desktop={desktop}
      pathname={pathname}
      focusRef={focusRef}
      runtime={runtime}
    />
  );
}

const staticViewport = () => null;
