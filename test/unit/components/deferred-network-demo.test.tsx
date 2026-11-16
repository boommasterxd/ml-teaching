import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import DeferredNetworkDemo from '@/components/hero/DeferredNetworkDemo';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

const lifecycle = vi.hoisted(() => ({ mounted: vi.fn() }));
vi.mock('@/components/NeuralNetViz', () => ({
  default: function ExampleDemo() {
    useEffect(() => {
      lifecycle.mounted();
    }, []);
    return <button>Hundebild zeigen</button>;
  },
}));
beforeEach(installBrowserHost);
afterEach(restoreBrowserHost);

describe('optional educational demo', () => {
  it('keeps startup static, prepares on intent without active effects and hands focus over on activation', async () => {
    render(<DeferredNetworkDemo />);
    expect(lifecycle.mounted).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Hundebild zeigen' })).toBeNull();
    const trigger = screen.getByRole('button', { name: 'Demo starten' });
    await act(async () => {
      trigger.focus();
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Hundebild zeigen', hidden: true })).toBeTruthy(),
    );
    expect(lifecycle.mounted).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Hundebild zeigen' })).toBeNull();
    fireEvent.click(trigger);
    const control = await screen.findByRole('button', { name: 'Hundebild zeigen' });
    await waitFor(() => expect(document.activeElement).toBe(control));
    expect(lifecycle.mounted).toHaveBeenCalledTimes(1);
  });
});
