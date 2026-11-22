import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import DeferredNetworkDemo from '@/components/hero/DeferredNetworkDemo';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

vi.mock('@/components/network/prepare-example', () => ({
  prepareExample: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/components/NeuralNetViz', () => {
  throw new Error('Demo chunk unavailable');
});
beforeEach(installBrowserHost);
afterEach(() => {
  cleanup();
  restoreBrowserHost();
});

describe('optional network module failure', () => {
  it('keeps the selected control focused and offers a bounded explicit retry', async () => {
    render(<DeferredNetworkDemo />);
    const cat = screen.getByRole('button', { name: 'Katzenbild zeigen' });
    await act(async () => cat.focus());
    fireEvent.click(cat);
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'Laden fehlgeschlagen. Wähle das Beispiel erneut.',
    );
    expect(cat.getAttribute('aria-disabled')).toBeNull();
    expect(document.activeElement).toBe(cat);
    fireEvent.click(cat);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(cat.getAttribute('aria-disabled')).toBeNull();
    expect(screen.queryByText('Signal wird verarbeitet…')).toBeNull();
  });
});
