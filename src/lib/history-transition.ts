import { learningPaths } from './learning-paths';

const historyBackType = 'history-back';
const historyForwardType = 'history-forward';

/** The initial training dialog belongs to the top layer, above the page content. */
export function canCaptureRoute(pathname: string | null) {
  return pathname !== null && pathname !== learningPaths.imagePractice;
}

function observePageCommit(
  content: HTMLElement,
  navigation: Navigation,
  destination: Pick<NavigationDestination, 'key' | 'url'>,
  transition: ViewTransition,
  lifetime?: AbortSignal,
) {
  const { promise, resolve } = Promise.withResolvers<void>();
  const { pathname } = new URL(destination.url);
  const listeners = new AbortController();
  // History can change before Next commits the destination content.
  const observer = new MutationObserver(checkCommit);

  function checkCommit() {
    if (
      navigation.currentEntry?.key === destination.key &&
      location.href === destination.url &&
      content.dataset.routePath === pathname
    )
      finish();
  }

  function finish() {
    observer.disconnect();
    listeners.abort();
    lifetime?.removeEventListener('abort', cancel);
    resolve();
  }

  function cancel() {
    if (!listeners.signal.aborted) transition.skipTransition();
    finish();
  }

  observer.observe(content, { attributeFilter: ['data-route-path'] });
  const options = { signal: listeners.signal };
  navigation.addEventListener('currententrychange', checkCommit, options);
  navigation.addEventListener(
    'navigate',
    (event) => {
      if (event.destination.url !== destination.url) cancel();
    },
    options,
  );
  window.addEventListener('pagehide', cancel, options);
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener(
    'change',
    (event) => {
      if (event.matches) cancel();
    },
    options,
  );
  if (lifetime?.aborted) cancel();
  else lifetime?.addEventListener('abort', cancel, { once: true });
  // The browser may skip a capture, including when its own update deadline expires.
  void transition.ready.catch(finish);
  checkCommit();
  return { promise, cancel };
}

function supportsHistorySnapshots() {
  return (
    typeof document.startViewTransition === 'function' &&
    CSS.supports('selector(:active-view-transition-type(history-back))')
  );
}

function animateBrowserTraversal(
  navigation: Navigation,
  event: NavigateEvent,
  content: HTMLElement,
  back: boolean,
  lifetime: AbortSignal,
) {
  const matchesDestination = () =>
    navigation.currentEntry?.key === event.destination.key &&
    location.href === event.destination.url;
  event.intercept({
    focusReset: 'manual',
    precommitHandler() {
      const { promise: oldPageCaptured, resolve: allowTraversal } = Promise.withResolvers<void>();
      const transition = document.startViewTransition({
        types: back ? ['nav-back', historyBackType] : ['nav-forward', historyForwardType],
        async update() {
          const destination = observePageCommit(
            content,
            navigation,
            event.destination,
            transition,
            lifetime,
          );
          const checkInterruption = () => {
            // A router state replacement can abort the intercepted event while keeping its entry.
            queueMicrotask(() => {
              if (!matchesDestination()) destination.cancel();
            });
          };
          const { signal } = event;
          if (signal.aborted) checkInterruption();
          else signal.addEventListener('abort', checkInterruption, { once: true });
          allowTraversal();
          try {
            await destination.promise;
          } finally {
            signal.removeEventListener('abort', checkInterruption);
          }
        },
      });
      // If a capture is interrupted, the browser must still be free to traverse.
      void transition.ready.catch(allowTraversal);
      return oldPageCaptured;
    },
  });
}

/** Keep native Back/Forward and let Next restore the original history entry. */
export function subscribeToHistoryTransitions(navigation: Navigation, content: HTMLElement) {
  const canInterceptTraversal =
    typeof NavigationPrecommitController !== 'undefined' &&
    'activeViewTransition' in document &&
    supportsHistorySnapshots();
  if (!canInterceptTraversal) return;
  const subscription = new AbortController();
  navigation.addEventListener(
    'navigate',
    (event) => {
      if (
        event.navigationType !== 'traverse' ||
        !event.cancelable ||
        event.defaultPrevented ||
        !event.canIntercept ||
        !event.destination.sameDocument ||
        event.hasUAVisualTransition ||
        document.activeViewTransition
      )
        return;
      const current = navigation.currentEntry;
      const destination = new URL(event.destination.url);
      if (
        !current ||
        event.destination.index < 0 ||
        event.destination.index === current.index ||
        destination.pathname === location.pathname ||
        !canCaptureRoute(destination.pathname)
      )
        return;
      animateBrowserTraversal(
        navigation,
        event,
        content,
        event.destination.index < current.index,
        subscription.signal,
      );
    },
    { signal: subscription.signal },
  );
  return () => subscription.abort();
}

/** Bridge native history restoration, which can commit outside React ViewTransition. */
export function goBackWithTransition(navigation: Navigation, entry: NavigationHistoryEntry) {
  const active = document.activeViewTransition;
  if (active?.types.has(historyBackType)) return true;
  if (active || !entry.url || !supportsHistorySnapshots()) return false;
  const content = document.querySelector<HTMLElement>('[data-route-capture]');
  if (!content) return false;
  const destination = { url: entry.url, key: entry.key };
  const transition = document.startViewTransition({
    types: ['nav-back', historyBackType],
    update() {
      const route = observePageCommit(content, navigation, destination, transition);
      const { committed, finished } = navigation.traverseTo(entry.key);
      void committed?.catch(route.cancel);
      void finished?.catch(route.cancel);
      return route.promise;
    },
  });
  void transition.ready.catch(() => {});
  return true;
}
