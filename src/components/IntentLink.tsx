'use client';

import { useCallback, type ComponentProps, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/** Native navigation warms its route payload only after pointer, keyboard or touch intent. */
export default function IntentLink({
  onPointerEnter,
  onFocus,
  onPointerDown,
  ...props
}: ComponentProps<typeof Link>) {
  const router = useRouter();
  const prepare = useCallback(
    (event: SyntheticEvent<HTMLAnchorElement>) => {
      if (event.defaultPrevented) return;
      const target = new URL(event.currentTarget.href);
      const current = window.location;
      if (
        !['http:', 'https:'].includes(target.protocol) ||
        target.origin !== current.origin ||
        (target.pathname === current.pathname && target.search === current.search)
      )
        return;
      router.prefetch(target.pathname + target.search);
    },
    [router],
  );

  return (
    <Link
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
