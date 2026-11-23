import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DeferredNetworkDemo from '@/components/hero/DeferredNetworkDemo';
import { ANIMATION, NETWORK_STAGES } from '@/constants';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

vi.mock('@/components/network/prepare-example', () => ({
  prepareExample: vi.fn(() => Promise.resolve()),
}));

beforeEach(() => {
  installBrowserHost();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  restoreBrowserHost();
});

describe('educational network demo', () => {
  it('runs one user-selected example at a time and can demonstrate both output classes', async () => {
    render(<DeferredNetworkDemo />);
    const dog = screen.getByRole('button', { name: 'Hundebild zeigen' });
    const cat = screen.getByRole('button', { name: 'Katzenbild zeigen' });
    await act(async () => {
      fireEvent.click(dog);
      await vi.dynamicImportSettled();
    });
    expect(dog.getAttribute('aria-disabled')).toBe('true');
    expect(cat.getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByText('Signal wird verarbeitet…')).toBeTruthy();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ANIMATION.STEP_DURATION_MS * NETWORK_STAGES.COMPLETE);
    });
    expect(screen.getByText('Hund erkannt')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('2 von 3 Nachbarn stimmen für Hund.');
    expect(
      screen
        .getByRole('progressbar', { name: 'Nachbarstimmen Hund' })
        .getAttribute('aria-valuetext'),
    ).toBe('2 von 3 Stimmen');
    expect(
      screen
        .getByRole('progressbar', { name: 'Nachbarstimmen Katze' })
        .getAttribute('aria-valuetext'),
    ).toBe('1 von 3 Stimmen');
    expect(cat.getAttribute('aria-disabled')).toBeNull();
    await act(async () => {
      fireEvent.click(cat);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ANIMATION.STEP_DURATION_MS * NETWORK_STAGES.COMPLETE);
    });
    expect(screen.getByText('Katze erkannt')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('2 von 3 Nachbarn stimmen für Katze.');
    expect(
      screen
        .getByRole('progressbar', { name: 'Nachbarstimmen Hund' })
        .getAttribute('aria-valuetext'),
    ).toBe('1 von 3 Stimmen');
    expect(
      screen
        .getByRole('progressbar', { name: 'Nachbarstimmen Katze' })
        .getAttribute('aria-valuetext'),
    ).toBe('2 von 3 Stimmen');
    expect(dog.getAttribute('aria-disabled')).toBeNull();
  });
});
