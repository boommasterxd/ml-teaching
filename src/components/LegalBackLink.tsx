'use client';

import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import { goBackWithTransition } from '@/lib/history-transition';
import AnimatedLink from './AnimatedLink';
import { ArrowLeft } from './icons/arrow-left';

function getPreviousEntry(navigation: Navigation) {
  return navigation.entries()[(navigation.currentEntry?.index ?? 0) - 1];
}

function getPreviousHref(navigation: Navigation, location: Location) {
  const previous = getPreviousEntry(navigation)?.url;
  if (!previous) return null;
  const url = new URL(previous);
  if (url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol)) return null;
  const path = url.pathname + url.search + url.hash;
  return path.startsWith('//') ? url.origin + path : path;
}

// A null target allows native traversal without an address. Undefined means home.
function getBackTarget(): string | null | undefined {
  const { navigation, history, location, performance } = window;
  if (navigation?.canGoBack) return getPreviousHref(navigation, location);
  if (history.length <= 1) return undefined;

  if (navigation) {
    // Crossing origins hides the previous entry. A referred push distinguishes a link
    // arrival from a fresh tab with an opaque initial entry or only forward history.
    const referredPush =
      navigation.activation?.navigationType === 'push' && document.referrer !== '';
    return referredPush ? null : undefined;
  }

  // Older browsers expose total history length but no current position.
  const documentUrl = performance.getEntriesByType('navigation')[0]?.name;
  const previousEntry = document.referrer !== '' || (documentUrl && documentUrl !== location.href);
  return previousEntry ? null : undefined;
}

function subscribeToBackTarget(onChange: () => void) {
  const navigation = window.navigation;
  const subscription = new AbortController();
  const options = { signal: subscription.signal };
  // Next.js updates history in an insertion effect. Notify React after that commit.
  const afterHistoryChange = () => {
    queueMicrotask(() => {
      if (!subscription.signal.aborted) onChange();
    });
  };
  if (navigation) navigation.addEventListener('currententrychange', afterHistoryChange, options);
  else {
    window.addEventListener('popstate', onChange, options);
    window.addEventListener('hashchange', onChange, options);
  }
  window.addEventListener('pageshow', onChange, options);
  return () => subscription.abort();
}

const getServerBackTarget = () => null;

export default function LegalBackLink() {
  const router = useRouter();
  const reduce = useShouldReduceMotion();
  const target = useSyncExternalStore(subscribeToBackTarget, getBackTarget, getServerBackTarget);

  // Native traversal restores the history entry. Only the fallback opens a new route.
  return (
    <AnimatedLink
      href={target ?? '/'}
      prepareOnIntent={target === undefined}
      transitionTypes={['nav-back']}
      variant="ghost"
      size="sm"
      className="legal-back-link"
      onNavigate={(event) => {
        if (getBackTarget() === undefined) return;
        event.preventDefault();
        const navigation = window.navigation;
        const entry = navigation && getPreviousEntry(navigation);
        if (
          !reduce &&
          entry?.sameDocument &&
          entry.url &&
          new URL(entry.url).pathname !== location.pathname &&
          goBackWithTransition(navigation, entry)
        )
          return;
        router.back();
      }}
    >
      <ArrowLeft data-icon="inline-start" aria-hidden="true" />
      Zurück
    </AnimatedLink>
  );
}
