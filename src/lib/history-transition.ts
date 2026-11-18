const historyBackType = 'history-back';

function restorePage(
  content: HTMLElement,
  navigation: Navigation,
  entry: NavigationHistoryEntry,
  skip: () => void,
) {
  return new Promise<void>((resolve) => {
    // The browser can settle its traversal before Next has committed the restored page.
    const observer = new MutationObserver(() => finish());
    const timeout = window.setTimeout(cancel, 200);
    function finish() {
      observer.disconnect();
      window.clearTimeout(timeout);
      resolve();
    }
    function cancel() {
      skip();
      finish();
    }
    observer.observe(content, { attributeFilter: ['data-route-capture'] });
    const { committed, finished } = navigation.traverseTo(entry.key);
    void committed?.catch(cancel);
    void finished?.catch(cancel);
  });
}

/** Bridge native history restoration, which can commit outside React ViewTransition. */
export function goBackWithTransition(navigation: Navigation, entry: NavigationHistoryEntry) {
  const active = document.activeViewTransition;
  if (active?.types.has(historyBackType)) return true;
  if (
    !document.startViewTransition ||
    !CSS.supports('selector(:active-view-transition-type(history-back))')
  ) {
    return false;
  }
  const content = document.querySelector<HTMLElement>('[data-route-capture]');
  if (!content) return false;
  const transition = document.startViewTransition({
    types: ['nav-back', historyBackType],
    update: () => restorePage(content, navigation, entry, () => transition.skipTransition()),
  });
  void transition.ready.catch(() => {});
  return true;
}
