import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeControl } from '@/components/theme/ThemeControl';
import * as loader from '@/components/theme/theme-menu-loader';
import { THEME_STORAGE_KEY } from '@/lib/theme';
import { toast } from '@/lib/toast';
import { installThemeHost, restoreThemeHost } from '../helpers/theme-host';

const actualLoad = loader.loadThemeMenu;
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn(), info: vi.fn() } }));
let host: ReturnType<typeof installThemeHost>;
beforeEach(() => {
  host = installThemeHost();
});
afterEach(() => {
  cleanup();
  restoreThemeHost();
});

function App() {
  return (
    <ThemeProvider>
      <h1>ML Teaching</h1>
      <ThemeControl />
    </ThemeProvider>
  );
}
const darkSwitch = () => screen.getByRole('switch', { name: 'Dunkle Darstellung' });
const trigger = () => screen.getByRole('button', { name: 'Darstellung einstellen' });
const rememberChoice = () => screen.getByRole('menuitemcheckbox', { name: 'Auswahl merken' });
const activate = (button: HTMLElement) => fireEvent.click(button, { detail: 0 });
async function openMenu() {
  const button = trigger();
  act(() => button.focus());
  activate(button);
  return screen.findByRole('menu', { name: 'Darstellung einstellen' });
}

describe('theme controls', () => {
  it('preserves required static content without an initial wipe or inline styles', () => {
    const document = new DOMParser().parseFromString(renderToStaticMarkup(<App />), 'text/html');
    expect(document.querySelector('h1')?.textContent).toBe('ML Teaching');
    expect(document.querySelector('[role="switch"]')).not.toBeNull();
    expect(document.querySelector('[style]')).toBeNull();
    expect(document.querySelector('[data-theme-wipe]')).toBeNull();
  });

  it('follows OS changes without writes and keeps an ordinary switch selection temporary', async () => {
    host.setSystemDark(true);
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const remove = vi.spyOn(Storage.prototype, 'removeItem');
    render(<App />);
    expect(darkSwitch().getAttribute('aria-checked')).toBe('true');
    fireEvent.click(darkSwitch());
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(false));
    act(() => {
      host.setSystemDark(false);
      host.setSystemDark(true);
    });
    expect(darkSwitch().getAttribute('aria-checked')).toBe('false');
    await openMenu();
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Systemeinstellung' }));
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true));
    expect(write).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it('remembers only after the explicit checkbox, restores the choice and lets the user remove it', async () => {
    const first = render(<App />);
    fireEvent.click(darkSwitch());
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true));
    expect(window.localStorage.length).toBe(0);
    await openMenu();
    fireEvent.click(rememberChoice());
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(window.localStorage.length).toBe(1);
    first.unmount();
    render(<App />);
    expect(darkSwitch().getAttribute('aria-checked')).toBe('true');
    fireEvent.click(darkSwitch());
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    await openMenu();
    fireEvent.click(rememberChoice());
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(darkSwitch());
    expect(window.localStorage.length).toBe(0);
  });

  it('handles cross-tab deletion and invalid values without recreating defaults or accepting session storage', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    render(<App />);
    const write = vi.spyOn(Storage.prototype, 'setItem');
    act(() =>
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: THEME_STORAGE_KEY,
          newValue: 'light',
          storageArea: window.sessionStorage,
        }),
      ),
    );
    expect(darkSwitch().getAttribute('aria-checked')).toBe('true');
    window.localStorage.clear();
    act(() =>
      window.dispatchEvent(
        new StorageEvent('storage', { key: null, storageArea: window.localStorage }),
      ),
    );
    expect(darkSwitch().getAttribute('aria-checked')).toBe('false');
    act(() =>
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: THEME_STORAGE_KEY,
          newValue: 'untrusted',
          storageArea: window.localStorage,
        }),
      ),
    );
    expect(document.documentElement.dataset.theme).toBe('system');
    expect(window.localStorage.length).toBe(0);
    expect(write).not.toHaveBeenCalled();
    await openMenu();
    expect(rememberChoice().getAttribute('aria-checked')).toBe('false');
  });

  it('can remember system mode while OS changes never rewrite it as a fixed color', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem');
    render(<App />);
    await openMenu();
    fireEvent.click(rememberChoice());
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
    act(() => host.setSystemDark(true));
    expect(darkSwitch().getAttribute('aria-checked')).toBe('true');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
    expect(write).toHaveBeenCalledOnce();
  });

  it('uses the OS and keeps temporary switching usable when stored preferences cannot be read', async () => {
    host.setSystemDark(true);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    const write = vi.spyOn(Storage.prototype, 'setItem');
    render(<App />);
    expect(darkSwitch().getAttribute('aria-checked')).toBe('true');
    fireEvent.click(darkSwitch());
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(false));
    expect(write).not.toHaveBeenCalled();
  });

  it('keeps appearance usable when remembering is blocked and explains a failed removal honestly', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    render(<App />);
    await openMenu();
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    fireEvent.click(rememberChoice());
    expect(toast.error).toHaveBeenLastCalledWith(expect.stringContaining('nicht gelöscht'), {
      id: 'theme-storage',
    });
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError');
    });
    fireEvent.click(rememberChoice());
    expect(toast.error).toHaveBeenLastCalledWith(expect.stringContaining('für diesen Aufruf'), {
      id: 'theme-storage',
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(darkSwitch());
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(false));
  });

  it('loads on intent without opening or stealing focus and supports Escape during a cold activation', async () => {
    let release!: (module: Awaited<ReturnType<typeof actualLoad>>) => void;
    const pending = new Promise<Awaited<ReturnType<typeof actualLoad>>>((resolve) => {
      release = resolve;
    });
    const load = vi.spyOn(loader, 'loadThemeMenu').mockReturnValue(pending);
    render(<App />);
    expect(load).not.toHaveBeenCalled();
    const button = trigger();
    act(() => button.focus());
    expect(document.activeElement).toBe(button);
    expect(screen.queryByRole('menu')).toBeNull();
    activate(button);
    expect(screen.getByRole('status').textContent).toContain('wird geladen');
    fireEvent.keyDown(document, { key: 'Escape' });
    await act(async () => {
      release(await actualLoad());
    });
    expect(trigger()).toBe(button);
    expect(document.activeElement).toBe(button);
    expect(screen.queryByRole('menu')).toBeNull();
    activate(button);
    await screen.findByRole('menu');
    expect(window.localStorage.length).toBe(0);
  });

  it('recovers from a failed menu chunk through its visible retry action', async () => {
    const load = vi
      .spyOn(loader, 'loadThemeMenu')
      .mockRejectedValue(new Error('Chunk unavailable'));
    render(<App />);
    const button = trigger();
    activate(button);
    await screen.findByRole('alert');
    load.mockImplementation(actualLoad);
    fireEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
    await screen.findByRole('menu');
    expect(trigger()).toBe(button);
    expect(window.localStorage.length).toBe(0);
  });

  it('returns focus immediately and makes exiting menu choices inert', async () => {
    render(<App />);
    const menu = await openMenu();
    const dark = screen.getByRole('menuitemradio', { name: 'Dunkel' });
    act(() => dark.focus());
    fireEvent.click(dark);
    expect(document.activeElement).toBe(trigger());
    expect(screen.queryByRole('menu')).toBeNull();
    if (menu.isConnected) expect(menu.hasAttribute('inert')).toBe(true);
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true));
  });
});
