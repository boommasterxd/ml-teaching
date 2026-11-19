import { act, fireEvent, render, screen } from '@testing-library/react';
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime';
import type { NextRouter } from 'next/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LegalBackLink from '@/components/LegalBackLink';
import { goBackWithTransition } from '@/lib/history-transition';
import { AppRouterHost, testRouter } from '../helpers/app-router-host';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

function installNavigation(traverseTo = vi.fn<Navigation['traverseTo']>()) {
  const entry = {
    key: 'learning',
    index: 0,
    sameDocument: true,
    url: new URL('/lernen', window.location.href).href,
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
  const start = vi.fn((options: StartViewTransitionOptions) => {
    Object.defineProperty(document, 'activeViewTransition', { configurable: true, value: active });
    return {
      ready: Promise.resolve(),
      updateCallbackDone: Promise.resolve().then(() => options.update?.()),
      skipTransition: skip,
    };
  });
  Object.defineProperty(document, 'startViewTransition', { configurable: true, value: start });
  return { skip, start };
}

describe('legal page back navigation', () => {
  beforeEach(() => {
    installBrowserHost();
    vi.clearAllMocks();
    vi.stubGlobal('CSS', { supports: vi.fn(() => true) });
  });
  afterEach(() => {
    Reflect.deleteProperty(document, 'startViewTransition');
    Reflect.deleteProperty(document, 'activeViewTransition');
    vi.useRealTimers();
    restoreBrowserHost();
  });

  it.each(['no View Transition API', 'no transition-type selector'])(
    'returns to the previous page when the browser has %s',
    async (limitation) => {
      const { navigation } = installNavigation();
      const transition = limitation === 'no transition-type selector' ? installTransition() : null;
      if (transition) vi.mocked(CSS.supports).mockReturnValue(false);

      // Outside the Next app build, its public Link export reads the Pages Router context.
      render(
        <RouterContext.Provider value={testRouter as unknown as NextRouter}>
          <LegalBackLink />
        </RouterContext.Provider>,
        { wrapper: AppRouterHost },
      );
      const back = screen.getByRole('link', { name: 'Zurück' });
      expect(back.getAttribute('href')).toBe('/lernen');
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
    const { start, skip } = installTransition();
    const traverse = vi.fn<Navigation['traverseTo']>();
    const { navigation, entry } = installNavigation(traverse);
    traverse.mockReturnValue({
      committed: Promise.resolve(entry),
      finished: Promise.resolve(entry),
    });
    const content = render(<main data-route-capture="legal" />);

    expect(goBackWithTransition(navigation, entry)).toBe(true);
    expect(goBackWithTransition(navigation, entry)).toBe(true);
    const settled = vi.fn();
    const completion = start.mock.results[0].value.updateCallbackDone.then(settled);
    await Promise.resolve();
    expect(traverse).toHaveBeenCalledExactlyOnceWith(entry.key);
    expect(settled).not.toHaveBeenCalled();

    content.rerender(<main data-route-capture="learning" />);
    await completion;
    await vi.runOnlyPendingTimersAsync();
    expect(skip).not.toHaveBeenCalled();
  });

  it('releases the transition if restored route content stalls', async () => {
    vi.useFakeTimers();
    const { start, skip } = installTransition();
    const traverse = vi.fn<Navigation['traverseTo']>();
    const { navigation, entry } = installNavigation(traverse);
    traverse.mockReturnValue({
      committed: Promise.resolve(entry),
      finished: Promise.resolve(entry),
    });
    render(<main data-route-capture="legal" />);

    expect(goBackWithTransition(navigation, entry)).toBe(true);
    await vi.runAllTimersAsync();
    await start.mock.results[0].value.updateCallbackDone;
    expect(skip).toHaveBeenCalledOnce();
    expect(traverse).toHaveBeenCalledExactlyOnceWith(entry.key);
  });

  it('releases the transition when a superseding navigation aborts restoration', async () => {
    const { start, skip } = installTransition();
    const traverse = vi.fn<Navigation['traverseTo']>();
    const { navigation, entry } = installNavigation(traverse);
    traverse.mockImplementation(() => ({
      committed: Promise.resolve(entry),
      finished: Promise.reject(new DOMException('Superseded', 'AbortError')),
    }));
    render(<main data-route-capture="legal" />);

    expect(goBackWithTransition(navigation, entry)).toBe(true);
    await start.mock.results[0].value.updateCallbackDone;
    expect(skip).toHaveBeenCalledOnce();
    expect(traverse).toHaveBeenCalledExactlyOnceWith(entry.key);
  });
});
