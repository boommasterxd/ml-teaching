import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import HeroScene from '@/components/hero/HeroScene';
import { EntryViewportReadyContext } from '@/components/ui/entry-policy';
import { HomePlaybackProvider, useHomePlayback } from '@/components/home/HomePlaybackProvider';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

const lifecycle = vi.hoisted(() => ({
  created: vi.fn(),
  disposed: vi.fn(),
  available: true,
}));
vi.mock('@/components/hero/TopographyField', () => ({
  default: function SyntheticGpuField({
    onRendered,
    onUnavailable,
  }: {
    onRendered: (ready: boolean) => void;
    onUnavailable: () => void;
  }) {
    useEffect(() => {
      lifecycle.created();
      if (!lifecycle.available) {
        onUnavailable();
        return;
      }
      onRendered(true);
      return () => {
        lifecycle.disposed();
        onRendered(false);
      };
    }, [onRendered, onUnavailable]);
    return lifecycle.available ? <canvas aria-hidden="true" /> : null;
  },
}));
beforeEach(() => {
  lifecycle.available = true;
  vi.clearAllMocks();
  installBrowserHost();
});
afterEach(restoreBrowserHost);

function PlaybackReadout() {
  const { paused } = useHomePlayback();
  return <p>{paused ? 'Previews paused' : 'Previews playing'}</p>;
}

describe('decorative hero lifetime', () => {
  it('waits for navigation snapshots to finish before starting the GPU field', async () => {
    const hero = (ready: boolean) => (
      <EntryViewportReadyContext value={ready}>
        <HomePlaybackProvider>
          <HeroScene />
        </HomePlaybackProvider>
      </EntryViewportReadyContext>
    );
    const { rerender } = render(hero(false));
    fireEvent.focus(screen.getByRole('button', { name: 'Animationen pausieren' }));
    await act(() => vi.dynamicImportSettled());
    expect(lifecycle.created).not.toHaveBeenCalled();
    rerender(hero(true));
    await waitFor(() => expect(lifecycle.created).toHaveBeenCalledTimes(1));
  });

  it('retains the paused GPU image and disposes it only when the document is hidden', async () => {
    const { container } = render(
      <HomePlaybackProvider>
        <HeroScene />
      </HomePlaybackProvider>,
    );
    await waitFor(() => expect(container.querySelector('canvas')).not.toBeNull());
    const canvas = container.querySelector('canvas');
    fireEvent.click(screen.getByRole('button', { name: 'Animationen pausieren' }));
    expect(container.querySelector('canvas')).toBe(canvas);
    expect(lifecycle.disposed).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Animationen fortsetzen' }));
    expect(container.querySelector('canvas')).toBe(canvas);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(container.querySelector('canvas')).toBeNull();
    expect(lifecycle.disposed).toHaveBeenCalledTimes(1);
    expect(lifecycle.created).toHaveBeenCalledTimes(1);
  });

  it('keeps the shared playback control usable when the GPU field fails', async () => {
    lifecycle.available = false;
    const { container } = render(
      <HomePlaybackProvider>
        <HeroScene />
        <PlaybackReadout />
      </HomePlaybackProvider>,
    );
    await waitFor(() => expect(container.querySelector('[data-field-unavailable]')).not.toBeNull());
    const pause = screen.getByRole('button', { name: 'Animationen pausieren' });
    pause.focus();
    fireEvent.click(pause);
    expect(screen.getByText('Previews paused')).toBeTruthy();
    const resume = screen.getByRole('button', { name: 'Animationen fortsetzen' });
    expect(document.activeElement).toBe(resume);
    fireEvent.click(resume);
    expect(screen.getByText('Previews playing')).toBeTruthy();
  });
});
