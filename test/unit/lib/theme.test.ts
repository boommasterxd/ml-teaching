import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import {
  THEME_BOOTSTRAP_SCRIPT,
  THEME_STORAGE_KEY,
  themeColors,
  applyTheme,
  parseTheme,
  rememberTheme,
} from '@/lib/theme';
import { installThemeHost, restoreThemeHost } from '../helpers/theme-host';

let host: ReturnType<typeof installThemeHost>;
beforeEach(() => {
  host = installThemeHost();
});
afterEach(() => {
  document.getElementById('site-theme-color')?.remove();
  restoreThemeHost();
});

function boot() {
  // Execute the exact trusted public entry script against the isolated browser host.
  new Function('localStorage', 'matchMedia', 'document', THEME_BOOTSTRAP_SCRIPT)(
    window.localStorage,
    window.matchMedia,
    document,
  );
}

describe('theme preference and prepaint contract', () => {
  it('accepts only the three documented values and refuses unknown writes', () => {
    expect(['light', 'dark', 'system'].map(parseTheme)).toEqual(['light', 'dark', 'system']);
    expect(parseTheme('dark; tracking=true')).toBeNull();
    expect(parseTheme(null)).toBeNull();
    expect(rememberTheme('unknown' as 'dark')).toBe(false);
    expect(window.localStorage.length).toBe(0);
  });

  it('applies the OS before paint without creating a preference, then restores an explicit saved choice', () => {
    host.setSystemDark(true);
    const writes = vi.spyOn(Storage.prototype, 'setItem');
    boot();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.dataset.theme).toBe('system');
    expect(document.getElementById('site-theme-color')?.getAttribute('content')).toBe(
      themeColors.dark,
    );
    expect(writes).not.toHaveBeenCalled();
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    writes.mockClear();
    boot();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
    expect(document.getElementById('site-theme-color')?.getAttribute('content')).toBe(
      themeColors.light,
    );
    expect(writes).not.toHaveBeenCalled();
    expect(document.documentElement.hasAttribute('style')).toBe(false);
  });

  it('updates the browser theme color without remembering the choice', () => {
    host.setSystemDark(true);
    boot();
    const writes = vi.spyOn(Storage.prototype, 'setItem');
    applyTheme('light', 'light');
    expect(document.getElementById('site-theme-color')?.getAttribute('content')).toBe(
      themeColors.light,
    );
    applyTheme('system', 'dark');
    expect(document.getElementById('site-theme-color')?.getAttribute('content')).toBe(
      themeColors.dark,
    );
    host.setSystemDark(false);
    applyTheme('system', 'light');
    expect(writes).not.toHaveBeenCalled();
  });

  it('ignores an invalid stored value and follows the OS when storage access is blocked', () => {
    host.setSystemDark(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'invalid');
    boot();
    expect(document.documentElement.dataset.theme).toBe('system');
    const storage = {
      getItem: () => {
        throw new DOMException('Blocked', 'SecurityError');
      },
    };
    new Function('localStorage', 'matchMedia', 'document', THEME_BOOTSTRAP_SCRIPT)(
      storage,
      window.matchMedia,
      document,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
