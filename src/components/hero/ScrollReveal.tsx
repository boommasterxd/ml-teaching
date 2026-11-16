'use client';

import { useSyncExternalStore, type ReactElement } from 'react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { AnimateIcon } from '@animate-ui/react/icons';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/** Required server content stays visible; only below-fold, hydrated decorations reveal on admission. */
export default function ScrollReveal({ children }: { children: ReactElement }) {
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  return (
    <AnimateIcon animateOnHover className="contents">
      <Effect
        asChild
        initial={false}
        fade={hydrated}
        slide={hydrated ? { offset: 16 } : false}
        inView
        inViewMargin="-32px"
      >
        {children}
      </Effect>
    </AnimateIcon>
  );
}
