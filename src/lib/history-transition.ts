import { learningPaths } from './learning-paths';

const historyBackType = 'history-back';
const historyForwardType = 'history-forward';

/** The initial training dialog belongs to the top layer, above the page content. */
export function canCaptureRoute(pathname: string | null) {
  return pathname !== null && pathname !== learningPaths.imagePractice;
}

function observePageCommit(
  content: HTMLElement,
  skip: () => void,
  matchesDestination: () => boolean = () => true,
) {
  const { promise, resolve } = Promise.withResolvers<void>();
  // Browser history can settle before Next has committed the destination content.
  const observer = new MutationObserver(() => {
    if (matchesDestination()) finish();
    else cancel();
  });
  const timeout = window.setTimeout(cancel, 200);
  let settled = false;
  function finish() {
    settled = true;
    observer.disconnect();
    window.clearTimeout(timeout);
    resolve();
  }
  function cancel() {
    if (settled) return;
    skip();
    finish();
  }
  observer.observe(content, { attributeFilter: ['data-route-capture'] });
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
            () => transition.skipTransition(),
            matchesDestination,
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
      animateBrowserTraversal(navigation, event, content, event.destination.index < current.index);
    },
    { signal: subscription.signal },
  );
  return () => subscription.abort();
}

/** Bridge native history restoration, which can commit outside React ViewTransition. */
export function goBackWithTransition(navigation: Navigation, entry: NavigationHistoryEntry) {
  const active = document.activeViewTransition;
  if (active?.types.has(historyBackType)) return true;
  if (!supportsHistorySnapshots()) return false;
  const content = document.querySelector<HTMLElement>('[data-route-capture]');
  if (!content) return false;
  const transition = document.startViewTransition({
    types: ['nav-back', historyBackType],
    update() {
      const route = observePageCommit(content, () => transition.skipTransition());
      const { committed, finished } = navigation.traverseTo(entry.key);
      void committed?.catch(route.cancel);
      void finished?.catch(route.cancel);
      return route.promise;
    },
  });
  void transition.ready.catch(() => {});
  return true;
}
