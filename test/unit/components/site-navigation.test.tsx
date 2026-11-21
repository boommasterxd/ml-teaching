import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { mediumViewport } from '@/lib/media-queries';
import { installThemeHost, restoreThemeHost } from '../helpers/theme-host';

const route = vi.hoisted(() => ({ pathname: '/lernen', router: { prefetch: vi.fn() } }));
vi.mock('next/navigation', () => ({
  usePathname: () => route.pathname,
  useRouter: () => route.router,
}));

const open = (trigger: HTMLElement) => fireEvent.click(trigger, { detail: 0 });
let desktop = false;

beforeEach(() => {
  installThemeHost();
  const media = vi.mocked(window.matchMedia);
  const actual = media.getMockImplementation()!;
  media.mockImplementation((query) => {
    const result = actual(query);
    if (query === mediumViewport) return { ...result, matches: desktop };
    return query === '(prefers-reduced-motion: reduce)' ? { ...result, matches: true } : result;
  });
  Object.defineProperty(SVGElement.prototype, 'getAnimations', {
    configurable: true,
    value: HTMLElement.prototype.getAnimations,
  });
  vi.resetModules();
  route.pathname = '/lernen';
  desktop = false;
});
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(SVGElement.prototype, 'getAnimations');
  restoreThemeHost();
});

async function renderNavigation() {
  const { default: SiteNavigation } = await import('@/components/SiteNavigation');
  return render(<SiteNavigation />);
}

describe('header navigation', () => {
  it('opens on activation and transfers keyboard focus between the trigger and its links', async () => {
    desktop = true;
    await renderNavigation();
    const trigger = screen.getByRole('button', { name: 'Lernlabor' });
    act(() => trigger.focus());
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
    open(trigger);

    const overview = await screen.findByRole('link', { name: 'Lernlabor-Übersicht' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(overview.getAttribute('aria-current')).toBe('page');
    expect(document.activeElement).toBe(overview);
    expect(screen.getByRole('link', { name: 'Bildmodell trainieren' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Simulation' })).toBeNull();
    expect(screen.getAllByText('Coming Soon')).toHaveLength(2);
    fireEvent.keyDown(overview, { key: 'Escape' });
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes an open menu when the current page changes', async () => {
    const { default: SiteNavigation } = await import('@/components/SiteNavigation');
    const { rerender } = render(<SiteNavigation />);
    const trigger = screen.getByRole('button', { name: 'Menü' });
    open(trigger);
    expect(await screen.findByRole('link', { name: 'Impressum' })).toBeTruthy();
    route.pathname = '/impressum';
    rerender(<SiteNavigation />);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    open(trigger);
    const imprint = await screen.findByRole('link', { name: 'Impressum' });
    expect(imprint.getAttribute('aria-current')).toBe('page');
  });
});
