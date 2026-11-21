'use client';

import { usePathname } from 'next/navigation';

const allowMotion = '(prefers-reduced-motion: no-preference)';

// Keep the same build-known bytes on every App Router document. Its CSP also
// applies when client navigation enables the rule on the homepage.
const stylesheet = `
@view-transition { navigation: auto; types: error-recovery; }
:root:active-view-transition-type(error-recovery) { view-transition-name: none; }
:root:active-view-transition-type(error-recovery)::view-transition { pointer-events: none; }
:root:active-view-transition-type(error-recovery) #main-content { view-transition-name: error-recovery-content; }
::view-transition-group(error-recovery-content) { animation: none; }
::view-transition-old(error-recovery-content) { animation: error-recovery-out 100ms ease-out both; }
::view-transition-new(error-recovery-content) { animation: error-recovery-in 120ms ease-out both; }
@keyframes error-recovery-out { to { opacity: 0; } }
@keyframes error-recovery-in { from { opacity: 0; } }
`;

export function ErrorRecoveryStyle({ enabled }: { enabled: boolean }) {
  return (
    <style id="error-recovery-transition" media={enabled ? allowMotion : 'not all'}>
      {stylesheet}
    </style>
  );
}

/** The browser needs the opt-in in the initial head and only while home is active. */
export default function ErrorRecoveryTransitionStyles() {
  return <ErrorRecoveryStyle enabled={usePathname() === '/'} />;
}
