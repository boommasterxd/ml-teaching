import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeControl } from '@/components/theme/ThemeControl';
import { toast } from '@/lib/toast';
import { THEME_STORAGE_KEY } from '@/lib/theme';
import { installThemeHost, restoreThemeHost } from '../helpers/theme-host';

vi.mock('@/lib/toast', () => ({ toast: { info: vi.fn() } }));

beforeEach(() => {
  installThemeHost();
});
afterEach(restoreThemeHost);

function renderControl() {
  render(
    <ThemeProvider>
      <ThemeControl />
    </ThemeProvider>,
  );
  return screen.getByRole('switch', { name: 'Dunkle Darstellung' });
}

function installWipe() {
  const finish: Array<() => void> = [];
  const start = vi.fn((options: { update: () => void } | (() => void)) => {
    (typeof options === 'function' ? options : options.update)();
    return { ready: Promise.resolve() };
  });
  Object.defineProperty(document, 'startViewTransition', { configurable: true, value: start });
  Object.defineProperty(document.documentElement, 'animate', {
    configurable: true,
    value: vi.fn(() => ({
      finished: new Promise<void>((resolve) => finish.push(resolve)),
    })),
  });
  return { start, finish };
}

describe('controlled theme wipe lifetime', () => {
  it('runs one wipe at a time and applies only the latest queued user selection', async () => {
    const { start, finish } = installWipe();
    const control = renderControl();
    fireEvent.click(control);
    await waitFor(() => expect(finish).toHaveLength(1));
    fireEvent.click(control);
    fireEvent.click(control);
    fireEvent.click(control);
    expect(start).toHaveBeenCalledOnce();
    await act(async () => finish[0]());
    await waitFor(() => expect(finish).toHaveLength(2));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    await act(async () => finish[1]());
    expect(control.getAttribute('aria-checked')).toBe('false');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(start).toHaveBeenCalledTimes(2);
    expect(window.localStorage.length).toBe(0);
  });

  it('does not replay a wipe when rapid reversal returns to the already painted choice', async () => {
    const { start, finish } = installWipe();
    const control = renderControl();
    fireEvent.click(control);
    await waitFor(() => expect(finish).toHaveLength(1));
    fireEvent.click(control);
    fireEvent.click(control);
    await act(async () => finish[0]());
    expect(start).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(control.getAttribute('aria-checked')).toBe('true');
  });

  it('never restores a removed preference or an older color when another tab clears during a wipe', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    const { start, finish } = installWipe();
    const control = renderControl();
    fireEvent.click(control);
    await waitFor(() => expect(finish).toHaveLength(1));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    window.localStorage.clear();
    act(() =>
      window.dispatchEvent(
        new StorageEvent('storage', { key: null, storageArea: window.localStorage }),
      ),
    );
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    await act(async () => finish[0]());
    expect(window.localStorage.length).toBe(0);
    expect(document.documentElement.dataset.theme).toBe('system');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(control.getAttribute('aria-checked')).toBe('false');
    expect(start).toHaveBeenCalledOnce();
  });

  it('handles native snapshot cancellation without losing the theme and reports other failures', async () => {
    const start = vi.fn(() => ({
      ready: Promise.reject(new DOMException('Superseded', 'AbortError')),
    }));
    Object.defineProperty(document, 'startViewTransition', { configurable: true, value: start });
    const control = renderControl();
    fireEvent.click(control);
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true));
    expect(screen.queryByRole('status')).toBeNull();
    start.mockImplementation(() => {
      throw new Error('Unsupported transition');
    });
    fireEvent.click(control);
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(false));
    expect(toast.info).toHaveBeenCalledWith(expect.stringContaining('ohne Animation'), {
      id: 'theme-animation',
    });
  });
});
