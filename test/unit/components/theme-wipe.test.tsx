import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ReducedMotionContext } from '@animate-ui/react/utils/motion';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeControl } from '@/components/theme/ThemeControl';
import { THEME_STORAGE_KEY } from '@/lib/theme';
import { installThemeHost, restoreThemeHost } from '../helpers/theme-host';

beforeEach(() => {
  installThemeHost();
});
afterEach(() => {
  cleanup();
  restoreThemeHost();
});

function appearance(reduce = false) {
  return (
    <ReducedMotionContext value={reduce ? 'always' : 'never'}>
      <ThemeProvider>
        <ThemeControl />
      </ThemeProvider>
    </ReducedMotionContext>
  );
}

const themeSwitch = () => screen.getByRole('switch', { name: 'Dunkle Darstellung' });
const wipe = () => document.querySelector('[data-theme-wipe]');

describe('decorative theme wipe lifetime', () => {
  it('applies rapid opposite selections immediately and keeps the focused switch', () => {
    const start = vi.fn();
    Object.defineProperty(document, 'startViewTransition', { configurable: true, value: start });
    render(appearance());
    const control = themeSwitch();
    act(() => control.focus());
    fireEvent.click(control);
    expect(control.getAttribute('aria-checked')).toBe('true');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(wipe()?.getAttribute('aria-hidden')).toBe('true');

    fireEvent.click(control);
    expect(control.getAttribute('aria-checked')).toBe('false');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.activeElement).toBe(control);
    expect(document.querySelectorAll('[data-theme-wipe]')).toHaveLength(1);
    expect(start).not.toHaveBeenCalled();
    expect(window.localStorage.length).toBe(0);
  });

  it('removes an active wipe on reduced motion without replaying it afterward', () => {
    const { rerender } = render(appearance());
    fireEvent.click(themeSwitch());
    expect(wipe()).not.toBeNull();

    rerender(appearance(true));
    expect(wipe()).toBeNull();
    expect(themeSwitch().getAttribute('aria-checked')).toBe('true');
    rerender(appearance());
    expect(wipe()).toBeNull();
  });

  it('never restores an older selection after another tab clears the remembered preference', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    render(appearance());
    fireEvent.click(themeSwitch());
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(wipe()).not.toBeNull();
    window.localStorage.clear();
    act(() =>
      window.dispatchEvent(
        new StorageEvent('storage', { key: null, storageArea: window.localStorage }),
      ),
    );
    expect(window.localStorage.length).toBe(0);
    expect(document.documentElement.dataset.theme).toBe('system');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(themeSwitch().getAttribute('aria-checked')).toBe('false');
    expect(wipe()).toBeNull();
  });
});
