import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { installThemeHost, restoreThemeHost } from '../helpers/theme-host';

const route = vi.hoisted(() => ({ pathname: '/lernen', router: { prefetch: vi.fn() } }));
vi.mock('next/navigation', () => ({
  usePathname: () => route.pathname,
  useRouter: () => route.router,
}));

const menuPanel = '@/components/HeaderMenuPanel';
const open = (trigger: HTMLElement) => fireEvent.click(trigger, { detail: 0 });

beforeEach(() => {
  installThemeHost();
  const media = vi.mocked(window.matchMedia);
  const actual = media.getMockImplementation()!;
  media.mockImplementation((query) => {
    const result = actual(query);
    return query === '(prefers-reduced-motion: reduce)' ? { ...result, matches: true } : result;
  });
  Object.defineProperty(SVGElement.prototype, 'getAnimations', {
    configurable: true,
    value: HTMLElement.prototype.getAnimations,
  });
  vi.resetModules();
  route.pathname = '/lernen';
});
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(SVGElement.prototype, 'getAnimations');
  vi.doUnmock(menuPanel);
  restoreThemeHost();
});

async function renderNavigation() {
  const { default: SiteNavigation } = await import('@/components/SiteNavigation');
  return render(<SiteNavigation />);
}

function holdPanel() {
  const { promise, resolve } = Promise.withResolvers<void>();
  const load = vi.fn(async (actual: () => Promise<unknown>) => {
    await promise;
    return actual();
  });
  vi.doMock(menuPanel, load);
  return { load, release: () => act(async () => resolve()) };
}

describe('header navigation panel preparation', () => {
  it('shares focus and activation preparation, then transfers a pending ArrowDown to the first link', async () => {
    const panel = holdPanel();
    await renderNavigation();
    const trigger = screen.getByRole('button', { name: 'Lernlabor' });
    expect(panel.load).not.toHaveBeenCalled();
    act(() => trigger.focus());
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
    open(trigger);
    expect(screen.getByRole('status').textContent).toContain('Navigation wird geladen');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    await panel.release();

    const overview = await screen.findByRole('link', { name: 'Lernlabor-Übersicht' });
    expect(panel.load).toHaveBeenCalledOnce();
    expect(overview.getAttribute('aria-current')).toBe('page');
    expect(document.activeElement).toBe(overview);
    expect(screen.getByRole('link', { name: 'Bildmodell trainieren' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Simulation' })).toBeNull();
    expect(screen.getAllByText('Coming Soon')).toHaveLength(2);
    fireEvent.keyDown(overview, { key: 'Escape' });
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('cancels a cold activation on Escape and reuses the prepared links on reopening', async () => {
    const panel = holdPanel();
    await renderNavigation();
    const trigger = screen.getByRole('button', { name: 'Menü' });
    act(() => trigger.focus());
    open(trigger);
    expect(trigger.getAttribute('aria-busy')).toBe('true');
    fireEvent.keyDown(document, { key: 'Escape' });
    await panel.release();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('link', { name: 'Impressum' })).toBeNull();
    expect(document.activeElement).toBe(trigger);
    open(trigger);
    expect(await screen.findByRole('link', { name: 'Impressum' })).toBeTruthy();
    expect(panel.load).toHaveBeenCalledOnce();
  });

  it('shows a retry after a failed chunk and keeps the same opener through recovery', async () => {
    vi.doMock(menuPanel, () => {
      throw new Error('Navigation chunk unavailable');
    });
    await renderNavigation();
    const trigger = screen.getByRole('button', { name: 'Rechtliches' });
    act(() => trigger.focus());
    open(trigger);
    expect((await screen.findByRole('alert')).textContent).toContain('nicht geladen');

    vi.doUnmock(menuPanel);
    fireEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(await screen.findByRole('link', { name: 'Datenschutz' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Rechtliches' })).toBe(trigger);
    expect(document.activeElement).toBe(trigger);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
