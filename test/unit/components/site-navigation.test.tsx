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
    const initialTrigger = screen.getByRole('button', { name: 'Lernlabor' });
    act(() => initialTrigger.focus());
    expect(initialTrigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(initialTrigger);
    open(initialTrigger);

    const overview = await screen.findByRole('link', { name: 'Lernlabor-Übersicht' });
    const trigger = screen.getByRole('button', { name: 'Lernlabor' });
    expect(document.activeElement).toBe(trigger);
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
    open(screen.getByRole('button', { name: 'Menü' }));
    expect(await screen.findByRole('link', { name: 'Impressum' })).toBeTruthy();
    const trigger = screen.getByRole('button', { name: 'Menü' });
    route.pathname = '/impressum';
    rerender(<SiteNavigation />);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    open(trigger);
    const imprint = await screen.findByRole('link', { name: 'Impressum' });
    expect(imprint.getAttribute('aria-current')).toBe('page');
  });
});
