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
  Reflect.deleteProperty(document, 'activeViewTransition');
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

function installThemeTransition() {
  const snapshot = Promise.withResolvers<void>();
  const animation = Promise.withResolvers<void>();
  const skip = vi.fn();
  const start = vi.fn((options: StartViewTransitionOptions) => {
    const ready = Promise.withResolvers<void>();
    // Skipping a View Transition rejects ready but its update still runs.
    const updateCallbackDone = snapshot.promise.then(() => options.update?.());
    void updateCallbackDone.then(ready.resolve, ready.reject);
    const transition = {
      types: new Set(options.types),
      ready: ready.promise,
      updateCallbackDone,
      skipTransition() {
        skip();
        Reflect.deleteProperty(document, 'activeViewTransition');
        ready.reject(new DOMException('Transition skipped', 'AbortError'));
      },
    };
    Object.defineProperty(document, 'activeViewTransition', {
      configurable: true,
      value: transition,
    });
    return transition;
  });
  const animate = vi.fn(() => ({ finished: animation.promise }));
  Object.defineProperty(document, 'startViewTransition', { configurable: true, value: start });
  Object.defineProperty(document.documentElement, 'animate', {
    configurable: true,
    value: animate,
  });
  return { start, skip, animate, capture: snapshot.resolve, finish: animation.resolve };
}

describe('native theme wipe lifetime', () => {
  it('keeps the latest selection and focus when the earlier capture has not updated yet', async () => {
    const { start, skip, animate, capture } = installThemeTransition();
    render(appearance());
    const control = themeSwitch();
    act(() => control.focus());
    fireEvent.click(control);
    expect(control.getAttribute('aria-checked')).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(control);
    expect(control.getAttribute('aria-checked')).toBe('false');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.activeElement).toBe(control);
    expect(start).toHaveBeenCalledOnce();
    expect(skip).toHaveBeenCalledOnce();

    await act(async () => capture());
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(animate).not.toHaveBeenCalled();
    expect(window.localStorage.length).toBe(0);
  });

  it('ends the active wipe on reduced motion without replaying it afterward', async () => {
    const { start, skip, animate, capture, finish } = installThemeTransition();
    const { rerender } = render(appearance());
    fireEvent.click(themeSwitch());
    await act(async () => capture());
    expect(animate).toHaveBeenCalledOnce();

    rerender(appearance(true));
    expect(skip).toHaveBeenCalledOnce();
    await act(async () => finish());
    expect(themeSwitch().getAttribute('aria-checked')).toBe('true');
    rerender(appearance());
    expect(start).toHaveBeenCalledOnce();
  });

  it('keeps the system theme when another tab clears the selection before the wipe finishes', async () => {
    const { animate, capture, finish } = installThemeTransition();
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    render(appearance());
    fireEvent.click(themeSwitch());
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    await act(async () => capture());
    expect(animate).toHaveBeenCalledOnce();
    window.localStorage.clear();
    act(() =>
      window.dispatchEvent(
        new StorageEvent('storage', { key: null, storageArea: window.localStorage }),
      ),
    );
    await act(async () => finish());
    expect(window.localStorage.length).toBe(0);
    expect(document.documentElement.dataset.theme).toBe('system');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(themeSwitch().getAttribute('aria-checked')).toBe('false');
  });
});
