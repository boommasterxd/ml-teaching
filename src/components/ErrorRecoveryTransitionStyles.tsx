'use client';

import { usePathname } from 'next/navigation';
import { ERROR_RECOVERY_STYLES } from '@/lib/view-transition-styles';

const allowMotion = '(prefers-reduced-motion: no-preference)';

export function ErrorRecoveryStyle({ enabled }: { enabled: boolean }) {
  return (
    <style id="error-recovery-transition" media={enabled ? allowMotion : 'not all'}>
      {ERROR_RECOVERY_STYLES}
    </style>
  );
}

/** The browser needs the opt-in in the initial head and only while home is active. */
export default function ErrorRecoveryTransitionStyles() {
  return <ErrorRecoveryStyle enabled={usePathname() === '/'} />;
}
