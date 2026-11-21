'use client';

import { usePathname } from 'next/navigation';
import { errorRecoveryStylesheetHref } from '@/lib/history-transition';

/** The browser needs the opt-in in the initial head and only while home is active. */
export default function ErrorRecoveryTransitionStyles() {
  if (usePathname() !== '/') return null;
  return (
    <link
      rel="stylesheet"
      href={errorRecoveryStylesheetHref}
      media="(prefers-reduced-motion: no-preference)"
    />
  );
}
