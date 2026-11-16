import { useCallback, useRef, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeControl } from '@/components/theme/ThemeControl';
import { Switch } from '@/components/ui/switch';
import { applyTheme } from '@/lib/theme';
import { installThemeHost, restoreThemeHost } from '../helpers/theme-host';

afterEach(restoreThemeHost);

function Appearance() {
  return (
    <ThemeProvider>
      <ThemeControl />
    </ThemeProvider>
  );
}

function ForwardedSwitch() {
  const following = useRef<HTMLButtonElement>(null);
  const [checked, setChecked] = useState(false);
  const ref = useCallback((node: HTMLButtonElement | null) => {
    if (node) return () => following.current?.focus();
  }, []);
  return (
    <>
      <Switch ref={ref} checked={checked} onCheckedChange={setChecked} aria-label="Darstellung" />
      <button ref={following}>Weiterarbeiten</button>
    </>
  );
}

describe('appearance hydration', () => {
  it('honors forwarded-ref cleanup and never takes focus back from a following control', async () => {
    installThemeHost();
    const container = document.createElement('div');
    container.innerHTML = renderToString(<ForwardedSwitch />);
    document.body.append(container);
    const initialSwitch = container.querySelector<HTMLElement>('[role="switch"]')!;
    const following = container.querySelector<HTMLButtonElement>('button:not([role])')!;
    const root = hydrateRoot(container, <ForwardedSwitch />);
    try {
      initialSwitch.focus();
      fireEvent.click(initialSwitch);
      await act(async () => {});
      expect(container.querySelector('[role="switch"]')?.getAttribute('aria-checked')).toBe('true');
      expect(document.activeElement).toBe(following);
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });

  it.each([false, true])(
    'keeps the first replayed selection temporary with initial system darkness %s',
    async (dark) => {
      const host = installThemeHost();
      host.setSystemDark(dark);
      applyTheme('system', dark ? 'dark' : 'light');
      const write = vi.spyOn(Storage.prototype, 'setItem');
      const container = document.createElement('div');
      container.innerHTML = renderToString(<Appearance />);
      document.body.append(container);
      const initialSwitch = container.querySelector<HTMLElement>('[role="switch"]')!;
      const errors = vi.fn();
      const root = hydrateRoot(container, <Appearance />, { onRecoverableError: errors });
      try {
        initialSwitch.focus();
        fireEvent.click(initialSwitch);
        await act(async () => {});
        await waitFor(() =>
          expect(document.documentElement.dataset.theme).toBe(dark ? 'light' : 'dark'),
        );
        expect(document.documentElement.classList.contains('dark')).toBe(!dark);
        expect(document.activeElement).toBe(container.querySelector('[role="switch"]'));
        expect(window.localStorage.length).toBe(0);
        expect(write).not.toHaveBeenCalled();
        expect(errors).not.toHaveBeenCalled();
      } finally {
        await act(async () => root.unmount());
        container.remove();
      }
    },
  );
});
