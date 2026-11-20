import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import LegalMobileNavigation from '@/components/LegalMobileNavigation';
import { AppRouterHost } from '../helpers/app-router-host';
import { installThemeHost, restoreThemeHost } from '../helpers/theme-host';

const chunk = vi.hoisted(() => {
  const gate = Promise.withResolvers<void>();
  return { request: vi.fn(() => gate.promise), release: () => gate.resolve() };
});

vi.mock(import('@/components/LegalMobileMenu'), async (importOriginal) => {
  await chunk.request();
  return importOriginal();
});

beforeEach(() => {
  installThemeHost();
  Object.defineProperty(SVGElement.prototype, 'getAnimations', {
    configurable: true,
    value: HTMLElement.prototype.getAnimations,
  });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(SVGElement.prototype, 'getAnimations');
  restoreThemeHost();
});

it('opens the pending information menu with keyboard focus and reuses the intent chunk', async () => {
  render(
    <AppRouterHost>
      <LegalMobileNavigation selectedValue="privacy" />
    </AppRouterHost>,
  );
  const trigger = screen.getByRole('button', { name: 'Informationen' });
  expect(chunk.request).not.toHaveBeenCalled();
  act(() => trigger.focus());
  expect(trigger.getAttribute('aria-expanded')).toBe('false');

  fireEvent.click(trigger, { detail: 0 });
  expect(trigger.getAttribute('aria-busy')).toBe('true');
  fireEvent.keyDown(trigger, { key: 'Escape' });
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(trigger);
  expect(screen.queryByRole('menu')).toBeNull();

  fireEvent.click(trigger, { detail: 0 });
  await act(async () => {
    chunk.release();
    await vi.dynamicImportSettled();
  });
  const first = await screen.findByRole('menuitem', { name: 'Impressum' });
  await waitFor(() => expect(document.activeElement).toBe(first));
  expect(screen.getByRole('menuitem', { name: 'Datenschutz' }).getAttribute('aria-current')).toBe(
    'page',
  );
  expect(screen.getByRole('button', { name: 'Informationen' })).toBe(trigger);
  expect(chunk.request).toHaveBeenCalledOnce();
});
