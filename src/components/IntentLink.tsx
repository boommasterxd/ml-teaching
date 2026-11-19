'use client';

import { useCallback, type ComponentProps, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { prepareRoute } from './prepare-route';

type IntentLinkProps = ComponentProps<typeof Link> & { prepareOnIntent?: boolean };
const forwardNavigation = ['nav-forward'];

/** Native navigation warms its route payload only after pointer, keyboard or touch intent. */
export default function IntentLink({
  onPointerEnter,
  onFocus,
  onPointerDown,
  prepareOnIntent = true,
  ...props
}: IntentLinkProps) {
  const router = useRouter();
  const prepare = useCallback(
    (event: SyntheticEvent<HTMLAnchorElement>) => {
      if (!prepareOnIntent || event.defaultPrevented) return;
      const target = new URL(event.currentTarget.href);
      const current = window.location;
      if (
        !['http:', 'https:'].includes(target.protocol) ||
        target.origin !== current.origin ||
        (target.pathname === current.pathname && target.search === current.search)
      )
        return;
      const path = target.pathname + target.search;
      prepareRoute(router, path.startsWith('//') ? target.origin + path : path, target.pathname);
    },
    [prepareOnIntent, router],
  );

  return (
    <Link
      transitionTypes={forwardNavigation}
      {...props}
      prefetch={false}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        prepare(event);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        prepare(event);
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        prepare(event);
      }}
    />
  );
}
