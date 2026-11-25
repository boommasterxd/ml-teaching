import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import DeferredNetworkDemo from '@/components/hero/DeferredNetworkDemo';
import { ANIMATION, NETWORK_STAGES } from '@/constants';
import { prepareExample } from '@/components/network/prepare-example';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

vi.mock('@/components/network/prepare-example', () => ({
  prepareExample: vi.fn(() => Promise.resolve()),
}));

beforeEach(() => {
  installBrowserHost();
  vi.mocked(prepareExample).mockReset().mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  restoreBrowserHost();
});

describe('optional educational demo', () => {
  it('prepares on intent without starting and keeps the focused control through activation', async () => {
    render(<DeferredNetworkDemo />);
    const dog = screen.getByRole('button', { name: 'Hundebild zeigen' });
    expect(screen.getByText('Kein Bild gewählt')).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Demo starten' })).toBeNull();
    await act(async () => dog.focus());
    expect(screen.getByText('Kein Bild gewählt')).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.queryByText('Signal wird verarbeitet…')).toBeNull();
    fireEvent.click(dog);
    await screen.findByText('Signal wird verarbeitet…');
    expect(screen.getByRole('img', { name: 'Generiertes Beispielbild eines Hundes' })).toBeTruthy();
    expect(screen.queryByText('Kein Bild gewählt')).toBeNull();
    expect(screen.getByRole('button', { name: 'Hundebild zeigen' })).toBe(dog);
    expect(document.activeElement).toBe(dog);
    expect(dog.getAttribute('data-active')).toBe('true');
  });

  it('continues the first cold touch selection and ignores overlapping signals', async () => {
    vi.useFakeTimers();
    try {
      render(<DeferredNetworkDemo />);
      const cat = screen.getByRole('button', { name: 'Katzenbild zeigen' });
      const dog = screen.getByRole('button', { name: 'Hundebild zeigen' });
      await act(async () => {
        fireEvent.pointerDown(cat, { pointerType: 'touch' });
        fireEvent.click(cat);
        fireEvent.click(dog);
      });
      expect(cat.getAttribute('data-active')).toBe('true');
      const visibility = vi.spyOn(document, 'visibilityState', 'get');
      visibility.mockReturnValue('hidden');
      fireEvent(document, new Event('visibilitychange'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ANIMATION.STEP_DURATION_MS * NETWORK_STAGES.COMPLETE);
      });
      expect(screen.getByText('Signal wird verarbeitet…')).toBeTruthy();
      expect(screen.queryByText('Katze erkannt')).toBeNull();
      visibility.mockReturnValue('visible');
      fireEvent(document, new Event('visibilitychange'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ANIMATION.STEP_DURATION_MS * NETWORK_STAGES.COMPLETE);
      });
      expect(screen.getByText('Katze erkannt')).toBeTruthy();
      expect(dog.getAttribute('aria-disabled')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('preserves focus moved elsewhere while the selected example becomes ready', async () => {
    render(
      <>
        <DeferredNetworkDemo />
        <button>Weiter</button>
      </>,
    );
    const cat = screen.getByRole('button', { name: 'Katzenbild zeigen' });
    const next = screen.getByRole('button', { name: 'Weiter' });
    fireEvent.click(cat);
    next.focus();
    await waitFor(() => expect(screen.getByText('Signal wird verarbeitet…')).toBeTruthy());
    expect(document.activeElement).toBe(next);
  });
  it('waits for the selected image and retries a failed load without losing focus', async () => {
    let rejectImage!: (reason: Error) => void;
    render(<DeferredNetworkDemo />);
    const cat = screen.getByRole('button', { name: 'Katzenbild zeigen' });
    await act(async () => cat.focus());
    vi.mocked(prepareExample).mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectImage = reject;
      }),
    );
    await act(async () => fireEvent.click(cat));
    expect(screen.queryByText('Signal wird verarbeitet…')).toBeNull();
    await act(async () => rejectImage(new Error('Image unavailable')));
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'Laden fehlgeschlagen. Wähle das Beispiel erneut.',
    );
    expect(document.activeElement).toBe(cat);
    await act(async () => fireEvent.click(cat));
    expect(await screen.findByText('Signal wird verarbeitet…')).toBeTruthy();
    expect(document.activeElement).toBe(cat);
  });
  it('retries a failed image after a completed example without losing focus', async () => {
    vi.useFakeTimers();
    try {
      render(<DeferredNetworkDemo />);
      const dog = screen.getByRole('button', { name: 'Hundebild zeigen' });
      const cat = screen.getByRole('button', { name: 'Katzenbild zeigen' });
      await act(async () => {
        fireEvent.click(dog);
        await vi.dynamicImportSettled();
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ANIMATION.STEP_DURATION_MS * NETWORK_STAGES.COMPLETE);
      });
      expect(screen.getByText('Hund erkannt')).toBeTruthy();
      await act(async () => cat.focus());
      vi.mocked(prepareExample).mockRejectedValueOnce(new Error('Image unavailable'));
      await act(async () => fireEvent.click(cat));
      expect(screen.getByRole('alert').textContent).toContain('Laden fehlgeschlagen');
      expect(document.activeElement).toBe(cat);
      await act(async () => fireEvent.click(cat));
      expect(screen.getByText('Signal wird verarbeitet…')).toBeTruthy();
      expect(document.activeElement).toBe(cat);
      await act(async () =>
        vi.advanceTimersByTimeAsync(ANIMATION.STEP_DURATION_MS * NETWORK_STAGES.COMPLETE),
      );
      expect(screen.getByText('Katze erkannt')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
  it('does not schedule a second sequence when its image resolves after unmount', async () => {
    vi.useFakeTimers();
    try {
      let resolveImage!: () => void;
      const { unmount } = render(<DeferredNetworkDemo />);
      const dog = screen.getByRole('button', { name: 'Hundebild zeigen' });
      const cat = screen.getByRole('button', { name: 'Katzenbild zeigen' });
      await act(async () => {
        fireEvent.click(dog);
        await vi.dynamicImportSettled();
      });
      await act(async () =>
        vi.advanceTimersByTimeAsync(ANIMATION.STEP_DURATION_MS * NETWORK_STAGES.COMPLETE),
      );
      expect(screen.getByText('Hund erkannt')).toBeTruthy();
      vi.mocked(prepareExample).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveImage = resolve;
        }),
      );
      await act(async () => fireEvent.click(cat));
      unmount();
      const schedule = vi.spyOn(globalThis, 'setTimeout');
      await act(async () => resolveImage());
      expect(schedule).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
