'use client';

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { LegalPage } from '@/content/site-navigation';
import { isLargeViewport, subscribeToLargeViewport } from '@/lib/media-queries';
import { useMenuModule } from './use-menu-module';

let pending: Promise<typeof import('./LegalNavigationLinks')> | undefined;

function loadDesktopLinks() {
  pending ??= import('./LegalNavigationLinks').catch((error: unknown) => {
    pending = undefined;
    throw error;
  });
  return pending;
}

const staticViewport = () => false;

/** Keep the server links usable until the visible desktop list can be enhanced. */
export default function LegalDesktopNavigation({
  page,
  children,
}: {
  page: LegalPage;
  children: ReactNode;
}) {
  const desktop = useSyncExternalStore(subscribeToLargeViewport, isLargeViewport, staticViewport);
  const { module, prepare } = useMenuModule(loadDesktopLinks);
  const [staticFocus, setStaticFocus] = useState(false);
  const [staticPointer, setStaticPointer] = useState(false);
  const Links = module?.default;
  const enhanced = desktop && Links && !staticFocus && !staticPointer;

  useEffect(() => {
    if (desktop) prepare();
  }, [desktop, prepare]);

  if (enhanced) return <Links page={page} />;

  return (
    <div
      className="menu-highlight-container"
      onPointerEnter={() => {
        if (!desktop) return;
        setStaticPointer(true);
        prepare();
      }}
      onPointerLeave={() => setStaticPointer(false)}
      onFocus={() => {
        setStaticFocus(true);
        if (desktop) prepare();
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setStaticFocus(false);
      }}
    >
      {children}
    </div>
  );
}
