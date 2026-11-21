import { act, fireEvent, render, screen } from '@testing-library/react';
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime';
import type { NextRouter } from 'next/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LegalBackLink from '@/components/LegalBackLink';
import { goBackWithTransition, subscribeToHistoryTransitions } from '@/lib/history-transition';
import { learningPaths } from '@/lib/learning-paths';
import { AppRouterHost, testRouter } from '../helpers/app-router-host';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

const learningEntryKey = 'learning';

function commitHistoryEntry(navigation: Navigation, key: string, url: string, index = 0) {
  history.replaceState(null, '', url);
  Object.assign(navigation, { currentEntry: { key, index } });
  navigation.dispatchEvent(new Event('currententrychange'));
}

function installNavigation(traverseTo = vi.fn<Navigation['traverseTo']>(), target = '/lernen') {
  const entry = {
    key: learningEntryKey,
    index: 0,
    sameDocument: true,
    url: new URL(target, window.location.href).href,
  } as NavigationHistoryEntry;
  const navigation = Object.assign(new EventTarget(), {
    currentEntry: { index: 1 },
    entries: () => [entry, { index: 1 }],
    canGoBack: true,
    traverseTo,
  }) as unknown as Navigation;
  vi.stubGlobal('navigation', navigation);
  return { entry, navigation };
}

function installTransition() {
  const skip = vi.fn();
  const active = { types: new Set(['history-back']) };
  Object.defineProperty(document, 'activeViewTransition', { configurable: true, value: null });
  const start = vi.fn((options: StartViewTransitionOptions) => {
    Object.defineProperty(document, 'activeViewTransition', { configurable: true, value: active });
    const { promise: ready, resolve, reject } = Promise.withResolvers<void>();
    const updateCallbackDone = Promise.resolve().then(() => options.update?.());
    void updateCallbackDone.then(resolve, reject);
    const release = () => {
      Object.defineProperty(document, 'activeViewTransition', { configurable: true, value: null });
    };
    void ready.then(release, release);
    return {
      ready,
      updateCallbackDone,
      skipTransition: skip,
      skipByBrowser: () => reject(new DOMException('Snapshot deadline', 'TimeoutError')),
    };
  });
  Object.defineProperty(document, 'startViewTransition', { configurable: true, value: start });
  return { skip, start };
}

function dispatchTraversal(
  navigation: Navigation,
  target: string,
  index: number,
  hasUAVisualTransition = false,
  signal = new AbortController().signal,
) {
  const intercept = vi.fn<(options: NavigationInterceptOptions) => void>();
  const event = new Event('navigate', { cancelable: true });
  navigation.dispatchEvent(
    Object.assign(event, {
      navigationType: 'traverse',
      destination: {
        sameDocument: true,
        index,
        key: learningEntryKey,
        url: new URL(target, location.href).href,
      },
      canIntercept: true,
      hasUAVisualTransition,
      signal,
      intercept,
    }),
  );
  return intercept;
}

function installBrowserTraversal() {
  vi.stubGlobal('NavigationPrecommitController', class {});
  const { navigation } = installNavigation();
  const { start, skip } = installTransition();
  const content = document.createElement('main');
  content.dataset.routePath = location.pathname;
  const stop = subscribeToHistoryTransitions(navigation, content);
  return { navigation, start, skip, content, stop };
}

function installBackAction() {
  const { start, skip } = installTransition();
  const traverse = vi.fn<Navigation['traverseTo']>();
  const { navigation, entry } = installNavigation(traverse);
  traverse.mockReturnValue({ committed: Promise.resolve(entry), finished: Promise.resolve(entry) });
  const content = render(<main data-route-capture="legal" data-route-path="/impressum" />);
  return { start, skip, traverse, navigation, entry, content };
}

describe('legal page back navigation', () => {
  const originalUrl = location.href;
  beforeEach(() => {
    history.replaceState(null, '', '/impressum');
    installBrowserHost();
    vi.clearAllMocks();
    vi.stubGlobal('CSS', { supports: vi.fn(() => true) });
  });
  afterEach(() => {
    Reflect.deleteProperty(document, 'startViewTransition');
    Reflect.deleteProperty(document, 'activeViewTransition');
    vi.useRealTimers();
    restoreBrowserHost();
    history.replaceState(null, '', originalUrl);
  });

  it.each(['no View Transition API', 'no transition-type selector', 'the training consent dialog'])(
    'returns to the previous page when the browser has %s',
    async (limitation) => {
      const target =
        limitation === 'the training consent dialog' ? learningPaths.imagePractice : '/lernen';
      const { navigation } = installNavigation(undefined, target);
      const transition = limitation === 'no View Transition API' ? null : installTransition();
      if (limitation === 'no transition-type selector')
        vi.mocked(CSS.supports).mockReturnValue(false);

      // Outside the Next app build, its public Link export reads the Pages Router context.
      render(
        <RouterContext.Provider value={testRouter as unknown as NextRouter}>
          <LegalBackLink />
        </RouterContext.Provider>,
        { wrapper: AppRouterHost },
      );
      const back = screen.getByRole('link', { name: 'Zurück' });
      expect(back.getAttribute('href')).toBe(target);
      fireEvent.focus(back);
      expect(testRouter.prefetch).not.toHaveBeenCalled();
      await act(async () => {
        fireEvent.click(back);
      });

      expect(testRouter.back).toHaveBeenCalledOnce();
      expect(testRouter.push).not.toHaveBeenCalled();
      expect(navigation.traverseTo).not.toHaveBeenCalled();
      if (transition) expect(transition.start).not.toHaveBeenCalled();
    },
  );

  it('keeps one back traversal in flight until the destination content commits', async () => {
    vi.useFakeTimers();
    const { start, skip, traverse, navigation, entry, content } = installBackAction();

    expect(goBackWithTransition(navigation, entry)).toBe(true);
    expect(goBackWithTransition(navigation, entry)).toBe(true);
    const settled = vi.fn();
    const completion = start.mock.results[0].value.updateCallbackDone.then(settled);
    await Promise.resolve();
    expect(traverse).toHaveBeenCalledExactlyOnceWith(entry.key);
    commitHistoryEntry(navigation, entry.key, '/lernen');
    await vi.advanceTimersByTimeAsync(350);
    expect(settled).not.toHaveBeenCalled();

    content.rerender(<main data-route-capture="learning" data-route-path="/lernen" />);
    await completion;
    expect(settled).toHaveBeenCalledOnce();
    expect(skip).not.toHaveBeenCalled();
  });

  it('releases pending content when the browser skips its snapshot', async () => {
    const { start, skip, traverse, navigation, entry } = installBackAction();

    expect(goBackWithTransition(navigation, entry)).toBe(true);
    const transition = start.mock.results[0].value;
    await Promise.resolve();
    transition.skipByBrowser();
    await transition.updateCallbackDone;
    window.dispatchEvent(new Event('pagehide'));
    expect(skip).not.toHaveBeenCalled();
    expect(traverse).toHaveBeenCalledExactlyOnceWith(entry.key);
  });

  it('releases the transition when a superseding navigation aborts restoration', async () => {
    const { start, skip, traverse, navigation, entry } = installBackAction();
    traverse.mockImplementation(() => ({
      committed: Promise.resolve(entry),
      finished: Promise.reject(new DOMException('Superseded', 'AbortError')),
    }));
    expect(goBackWithTransition(navigation, entry)).toBe(true);
    await start.mock.results[0].value.updateCallbackDone;
    expect(skip).toHaveBeenCalledOnce();
    expect(traverse).toHaveBeenCalledExactlyOnceWith(entry.key);
  });

  it.each([
    [0, 'nav-back', 'history-back'],
    [2, 'nav-forward', 'history-forward'],
  ] as const)(
    'can animate a native history traversal to entry %i',
    async (index, type, historyType) => {
      const { navigation, start, skip, content, stop } = installBrowserTraversal();
      try {
        const intercept = dispatchTraversal(navigation, '/lernen', index);
        const options = intercept.mock.calls[0]?.[0];
        expect(options?.focusReset).toBe('manual');
        await options?.precommitHandler?.({} as NavigationPrecommitController);
        expect(start.mock.calls[0]?.[0].types).toEqual([type, historyType]);
        commitHistoryEntry(navigation, learningEntryKey, '/lernen', index);
        content.dataset.routePath = '/lernen';
        await start.mock.results[0]?.value.updateCallbackDone;
        expect(skip).not.toHaveBeenCalled();
        expect(navigation.traverseTo).not.toHaveBeenCalled();
      } finally {
        stop?.();
      }
    },
  );

  it.each([
    ['the committed destination', learningEntryKey, '/lernen', 0],
    ['a different entry at the same URL', 'other-learning', '/lernen', 1],
    ['the same entry at another URL', learningEntryKey, '/impressum', 1],
  ] as const)('handles a router history update to %s', async (_, key, url, skips) => {
    const { navigation, start, skip, content, stop } = installBrowserTraversal();
    const controller = new AbortController();
    try {
      const intercept = dispatchTraversal(navigation, '/lernen', 0, false, controller.signal);
      await intercept.mock.calls[0]?.[0].precommitHandler?.({} as NavigationPrecommitController);
      commitHistoryEntry(navigation, learningEntryKey, '/lernen');
      controller.abort();
      commitHistoryEntry(navigation, key, url);
      content.dataset.routePath = '/lernen';
      await start.mock.results[0]?.value.updateCallbackDone;
      expect(skip).toHaveBeenCalledTimes(skips);
    } finally {
      stop?.();
    }
  });

  it('cleans up a pending browser traversal when its route subscription ends', async () => {
    const { navigation, start, skip, stop } = installBrowserTraversal();
    try {
      const intercept = dispatchTraversal(navigation, '/lernen', 0);
      await intercept.mock.calls[0]?.[0].precommitHandler?.({} as NavigationPrecommitController);
      stop?.();
      await start.mock.results[0].value.updateCallbackDone;
      window.dispatchEvent(new Event('pagehide'));
      expect(skip).toHaveBeenCalledOnce();
      expect(dispatchTraversal(navigation, '/datenschutz', 0)).not.toHaveBeenCalled();
    } finally {
      stop?.();
    }
  });

  it('leaves the consent dialog, same-page entries and existing browser visuals to the browser', () => {
    vi.stubGlobal('NavigationPrecommitController', class {});
    const { navigation } = installNavigation();
    const { start } = installTransition();
    const stop = subscribeToHistoryTransitions(navigation, document.createElement('main'));
    try {
      expect(dispatchTraversal(navigation, learningPaths.imagePractice, 0)).not.toHaveBeenCalled();
      expect(
        dispatchTraversal(navigation, location.pathname + '#section', 0),
      ).not.toHaveBeenCalled();
      expect(dispatchTraversal(navigation, '/lernen', 0, true)).not.toHaveBeenCalled();
      expect(start).not.toHaveBeenCalled();
    } finally {
      stop?.();
    }
  });
});
