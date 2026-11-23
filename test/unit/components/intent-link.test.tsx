import { createElement, createRef, type ComponentProps, type ReactNode } from 'react';
import type Link from 'next/link';
import type { NextRouter } from 'next/router';
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import IntentLink from '@/components/IntentLink';
import AnimatedLink from '@/components/AnimatedLink';
import { TrainingEntryContext } from '@/components/training/TrainingEntryContext';
import { learningPaths } from '@/lib/learning-paths';
import ServerError, { getStaticProps } from '@/pages/500';
import { AppRouterHost, testRouter } from '../helpers/app-router-host';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

const nativeLink = vi.hoisted(() => ({ props: vi.fn() }));

// Inspect the resource contract while preserving Next's actual Link rendering and events.
vi.mock('next/link', async (importOriginal) => {
  const NativeLink = (await importOriginal<typeof import('next/link')>()).default;
  return {
    default: (props: ComponentProps<typeof Link>) => {
      nativeLink.props(props);
      return createElement(NativeLink, props);
    },
  };
});

const linkRouter = {
  ...testRouter,
  route: '/',
  pathname: '/',
  query: {},
  asPath: '/',
  basePath: '',
  isFallback: false,
  isReady: true,
  isPreview: false,
  isLocaleDomain: false,
  beforePopState: vi.fn(),
  reload: vi.fn(),
  events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
} satisfies NextRouter;

function LinkActivationHost({ children }: { children: ReactNode }) {
  return (
    <AppRouterHost>
      <RouterContext value={linkRouter}>{children}</RouterContext>
    </AppRouterHost>
  );
}

beforeEach(() => {
  installBrowserHost();
  vi.clearAllMocks();
  window.history.replaceState(null, '', '/');
});
afterEach(() => {
  vi.useRealTimers();
  restoreBrowserHost();
});

describe('intent-only native navigation', () => {
  it('keeps viewport preparation off and warms the native URL on hover and keyboard focus', () => {
    render(
      <IntentLink href={{ pathname: '/lernen', query: { mode: 'bilder' } }}>Lernen</IntentLink>,
      { wrapper: AppRouterHost },
    );
    const link = screen.getByRole('link', { name: 'Lernen' });
    expect(nativeLink.props.mock.lastCall?.[0].prefetch).toBe(false);
    expect(testRouter.prefetch).not.toHaveBeenCalled();
    fireEvent.pointerEnter(link, { pointerType: 'mouse' });
    fireEvent.focus(link);
    expect(testRouter.prefetch.mock.calls).toEqual([
      ['/lernen?mode=bilder'],
      ['/lernen?mode=bilder'],
    ]);
    expect(nativeLink.props.mock.calls.every(([props]) => props.prefetch === false)).toBe(true);
    expect(screen.getByRole('link', { name: 'Lernen' })).toBe(link);
  });

  const contact = { pointerType: 'touch', pointerId: 1, isPrimary: true };

  it('keeps a quick tap and its focus from preparing the same route as activation', () => {
    vi.useFakeTimers();
    render(<IntentLink href="/lernen">Lernen</IntentLink>, { wrapper: LinkActivationHost });
    const link = screen.getByRole('link');
    fireEvent.pointerEnter(link, contact);
    fireEvent.pointerDown(link, contact);
    vi.advanceTimersByTime(10);
    fireEvent.pointerUp(link, contact);
    fireEvent.focus(link);
    fireEvent.click(link);

    expect(testRouter.push).toHaveBeenCalledOnce();
    vi.runOnlyPendingTimers();
    expect(testRouter.prefetch).not.toHaveBeenCalled();
  });

  it('warms a held touch through the same router and does not repeat on release focus', () => {
    vi.useFakeTimers();
    render(<IntentLink href="/lernen?mode=bilder">Lernen</IntentLink>, { wrapper: AppRouterHost });
    const link = screen.getByRole('link');
    fireEvent.pointerEnter(link, contact);
    fireEvent.pointerDown(link, contact);
    fireEvent.focus(link);
    expect(testRouter.prefetch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(79);
    expect(testRouter.prefetch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    fireEvent.pointerUp(link, contact);
    fireEvent.focus(link);
    vi.runOnlyPendingTimers();
    expect(testRouter.prefetch).toHaveBeenCalledExactlyOnceWith('/lernen?mode=bilder');
  });

  it('drops cancelled touch preparation and permits subsequent keyboard focus to warm the route', () => {
    vi.useFakeTimers();
    render(<IntentLink href="/lernen">Lernen</IntentLink>, { wrapper: AppRouterHost });
    const link = screen.getByRole('link');
    fireEvent.pointerDown(link, contact);
    fireEvent.pointerCancel(link, contact);
    vi.runOnlyPendingTimers();
    expect(testRouter.prefetch).not.toHaveBeenCalled();

    fireEvent.focus(link);
    expect(testRouter.prefetch).toHaveBeenCalledExactlyOnceWith('/lernen');
  });

  it('prepares a training destination on a quick touch because activation opens setup first', () => {
    const entry = { prepareEntry: vi.fn(), openEntry: vi.fn() };
    render(
      <TrainingEntryContext value={entry}>
        <IntentLink href={learningPaths.imagePractice}>Bildmodell trainieren</IntentLink>
      </TrainingEntryContext>,
      { wrapper: LinkActivationHost },
    );
    const link = screen.getByRole('link');
    fireEvent.pointerDown(link, contact);
    fireEvent.pointerUp(link, contact);
    fireEvent.focus(link);
    fireEvent.click(link);

    expect(testRouter.prefetch).toHaveBeenCalledExactlyOnceWith(learningPaths.imagePractice);
    expect(entry.prepareEntry).toHaveBeenCalledOnce();
    expect(entry.openEntry).toHaveBeenCalledExactlyOnceWith(link);
    expect(testRouter.push).not.toHaveBeenCalled();
  });

  it('respects caller cancellation before each kind of preparation', () => {
    const cancel = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <IntentLink
        href="/datenschutz"
        onPointerEnter={cancel}
        onFocus={cancel}
        onPointerDown={cancel}
      >
        Datenschutz
      </IntentLink>,
      { wrapper: AppRouterHost },
    );
    const link = screen.getByRole('link');
    fireEvent.pointerEnter(link);
    fireEvent.focus(link);
    fireEvent.pointerDown(link);
    expect(cancel).toHaveBeenCalledTimes(3);
    expect(testRouter.prefetch).not.toHaveBeenCalled();
  });

  it('warms first-view images for reduced motion with the destination’s responsive selectors', async () => {
    const media = vi.mocked(window.matchMedia);
    const actual = media.getMockImplementation()!;
    media.mockImplementation((query) => ({
      ...actual(query),
      matches: query === '(prefers-reduced-motion: reduce)',
    }));
    window.history.replaceState(null, '', '/impressum');
    render(
      <>
        <IntentLink href="/">Startseite</IntentLink>
        <IntentLink href="/lernen/bilderkennung">Bilderkennung</IntentLink>
      </>,
      { wrapper: AppRouterHost },
    );
    const posters = 'link[rel="preload"][imagesrcset*="hero-glass"]';
    const photos = 'link[rel="preload"][imagesrcset]:not([imagesrcset*="hero-glass"])';
    expect(document.head.querySelector(posters)).toBeNull();
    expect(document.head.querySelector(photos)).toBeNull();
    fireEvent.focus(screen.getByRole('link', { name: 'Startseite' }));
    await waitFor(() => {
      const hints = [...document.head.querySelectorAll(posters)];
      expect(hints.map((link) => link.getAttribute('media'))).toEqual([
        '(width < 48rem)',
        '(width >= 48rem)',
      ]);
      expect(
        hints.every((link) => link.getAttribute('imagesrcset')?.startsWith('/_next/image?')),
      ).toBe(true);
    });
    fireEvent.pointerEnter(screen.getByRole('link', { name: 'Bilderkennung' }));
    await waitFor(() => expect(document.head.querySelectorAll(photos)).toHaveLength(2));
    expect(testRouter.prefetch.mock.calls).toEqual([['/'], ['/lernen/bilderkennung']]);
  });

  it('prepares only other same-origin HTTP routes, retaining search and excluding fragments', () => {
    window.history.replaceState(null, '', '/lernen?mode=bilder');
    render(
      <>
        <IntentLink href="#hinweise">Hinweise</IntentLink>
        <IntentLink href="/lernen?mode=bilder#daten">Daten</IntentLink>
        <IntentLink href="https://example.org/lernen">Extern</IntentLink>
        <IntentLink href="mailto:person@example.org">E-Mail</IntentLink>
        <IntentLink href="/lernen?mode=kamera#daten">Kamera</IntentLink>
      </>,
      { wrapper: AppRouterHost },
    );
    for (const link of screen.getAllByRole('link')) fireEvent.focus(link);
    expect(testRouter.prefetch).toHaveBeenCalledExactlyOnceWith('/lernen?mode=kamera');
  });

  it('retains ref forwarding, native modified clicks and props through the shared action wrapper', () => {
    const ref = createRef<HTMLAnchorElement>();
    const clicked = vi.fn((event: { ctrlKey: boolean }) => {
      expect(event.ctrlKey).toBe(true);
    });
    render(
      <AnimatedLink
        href="/impressum"
        ref={ref}
        transitionTypes={['nav-back']}
        target="_blank"
        rel="noopener"
        aria-current="page"
        onClick={clicked}
      >
        Impressum
      </AnimatedLink>,
      { wrapper: AppRouterHost },
    );
    const link = screen.getByRole('link');
    expect(ref.current).toBe(link);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener');
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(nativeLink.props.mock.lastCall?.[0].transitionTypes).toEqual(['nav-back']);
    expect(fireEvent.click(link, { ctrlKey: true })).toBe(true);
    expect(clicked).toHaveBeenCalledOnce();
    expect(testRouter.prefetch).not.toHaveBeenCalled();
  });

  it('prepares the training setup on intent and leaves modified activation to the browser', () => {
    const entry = { prepareEntry: vi.fn(), openEntry: vi.fn() };
    render(
      <TrainingEntryContext value={entry}>
        <IntentLink href={learningPaths.imagePractice}>Bildmodell trainieren</IntentLink>
      </TrainingEntryContext>,
      { wrapper: LinkActivationHost },
    );
    const link = screen.getByRole('link');
    fireEvent.focus(link);
    expect(testRouter.prefetch).toHaveBeenCalledExactlyOnceWith(learningPaths.imagePractice);
    expect(entry.prepareEntry).toHaveBeenCalledOnce();
    expect(entry.openEntry).not.toHaveBeenCalled();

    // Observe the default reaching the document without asking jsdom to open a tab.
    const browserDefault = vi.fn((event: MouseEvent) => {
      const available = !event.defaultPrevented;
      event.preventDefault();
      return available;
    });
    document.addEventListener('click', browserDefault, { once: true });
    fireEvent.click(link, { ctrlKey: true });
    expect(browserDefault).toHaveReturnedWith(true);
    expect(entry.openEntry).not.toHaveBeenCalled();

    expect(fireEvent.click(link)).toBe(false);
    expect(entry.openEntry).toHaveBeenCalledExactlyOnceWith(link);
    expect(testRouter.push).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe('/');
  });

  it('honors a caller that cancels training navigation', () => {
    const entry = { prepareEntry: vi.fn(), openEntry: vi.fn() };
    render(
      <TrainingEntryContext value={entry}>
        <IntentLink
          href={learningPaths.imagePractice}
          onNavigate={(event) => event.preventDefault()}
        >
          Bildmodell trainieren
        </IntentLink>
      </TrainingEntryContext>,
      { wrapper: LinkActivationHost },
    );
    fireEvent.click(screen.getByRole('link'));
    expect(entry.openEntry).not.toHaveBeenCalled();
    expect(testRouter.push).not.toHaveBeenCalled();
  });

  it('retains the Pages Router error recovery link in static output with its supplied adapter', () => {
    const markup = renderToStaticMarkup(
      <AppRouterHost>
        <ServerError {...getStaticProps().props} />
      </AppRouterHost>,
    );
    const document = new DOMParser().parseFromString(markup, 'text/html');
    expect(document.querySelector('h1')?.textContent).toBe(
      'Diese Seite konnte nicht geladen werden',
    );
    expect(document.querySelector('a')?.getAttribute('href')).toBe('/');
    expect(document.querySelector('[style], script')).toBeNull();
    expect(testRouter.prefetch).not.toHaveBeenCalled();
  });
});
