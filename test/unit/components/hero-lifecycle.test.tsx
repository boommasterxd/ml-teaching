import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import HeroScene from '@/components/hero/HeroScene';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

const lifecycle = vi.hoisted(() => ({ created: vi.fn(), disposed: vi.fn() }));
vi.mock('@/components/hero/TopographyField', () => ({
  default: function SyntheticGpuField({ onRendered }: { onRendered: (ready: boolean) => void }) {
    useEffect(() => {
      lifecycle.created();
      onRendered(true);
      return () => {
        lifecycle.disposed();
        onRendered(false);
      };
    }, [onRendered]);
    return <canvas aria-hidden="true" />;
  },
}));
beforeEach(installBrowserHost);
afterEach(restoreBrowserHost);

describe('decorative hero lifetime', () => {
  it('retains the paused GPU image and disposes it only when the document is hidden', async () => {
    const { container } = render(<HeroScene />);
    await waitFor(() => expect(container.querySelector('canvas')).not.toBeNull());
    const canvas = container.querySelector('canvas');
    fireEvent.click(screen.getByRole('button', { name: 'Animation pausieren' }));
    expect(container.querySelector('canvas')).toBe(canvas);
    expect(lifecycle.disposed).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Animation fortsetzen' }));
    expect(container.querySelector('canvas')).toBe(canvas);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(container.querySelector('canvas')).toBeNull();
    expect(lifecycle.disposed).toHaveBeenCalledTimes(1);
    expect(lifecycle.created).toHaveBeenCalledTimes(1);
  });
});
