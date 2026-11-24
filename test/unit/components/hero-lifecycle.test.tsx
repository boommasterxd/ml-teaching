import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ErrorGlassArtwork from '@/components/hero/ErrorGlassArtwork';
import HeroScene from '@/components/hero/HeroScene';
import { errorRingPosterImages, heroPosterImages } from '@/components/hero/poster-assets';
import { EntryViewportReadyContext } from '@/components/ui/entry-policy';
import { HomePlaybackProvider, useHomePlayback } from '@/components/home/HomePlaybackProvider';
import { ReducedMotionContext } from '@animate-ui/react/utils/motion';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

const lifecycle = vi.hoisted(() => ({
  created: vi.fn(),
  disposed: vi.fn(),
  available: true,
  canDraw: true,
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
      if (lifecycle.canDraw) onRendered(true);
      return () => {
        lifecycle.disposed();
        onRendered(false);
      };
    }, [onRendered, onUnavailable]);
    return lifecycle.available ? (
      <>
        <canvas aria-hidden="true" />
        <button type="button">Lichtimpuls auslösen</button>
      </>
    ) : null;
  },
}));
beforeEach(() => {
  lifecycle.available = true;
  lifecycle.canDraw = true;
  vi.clearAllMocks();
  installBrowserHost();
});
afterEach(() => {
  vi.useRealTimers();
  restoreBrowserHost();
});

function PlaybackReadout() {
  const { paused } = useHomePlayback();
  return <p>{paused ? 'Previews paused' : 'Previews playing'}</p>;
}

describe('decorative hero lifetime', () => {
  it('keeps deferred error artwork idle until load while honoring early keyboard intent', async () => {
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
    render(<ErrorGlassArtwork deferStartup sources={errorRingPosterImages} />);

    await act(
      () =>
        new Promise<void>((painted) => {
          requestAnimationFrame(() => requestAnimationFrame(() => painted()));
        }),
    );
    expect(lifecycle.created).not.toHaveBeenCalled();
    const playback = screen.getByRole('button', { name: 'Animation pausieren' });
    act(() => playback.focus());

    await waitFor(() => expect(lifecycle.created).toHaveBeenCalledTimes(1));
    expect(document.activeElement).toBe(playback);
  });

  it('waits for navigation snapshots to finish before starting the GPU field', async () => {
    const hero = (ready: boolean) => (
      <EntryViewportReadyContext value={ready}>
        <HomePlaybackProvider>
          <HeroScene sources={heroPosterImages} />
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
        <HeroScene sources={heroPosterImages} />
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

  it('returns focus to playback when reduced motion removes the focused light impulse', async () => {
    const hero = (reduce: boolean) => (
      <ReducedMotionContext value={reduce ? 'always' : 'never'}>
        <HomePlaybackProvider>
          <HeroScene sources={heroPosterImages} />
        </HomePlaybackProvider>
      </ReducedMotionContext>
    );
    const { container, rerender } = render(hero(false));
    const impulse = await screen.findByRole('button', { name: 'Lichtimpuls auslösen' });
    act(() => impulse.focus());

    rerender(hero(true));
    const playback = screen.getByRole('button', { name: 'Bewegung reduziert' });
    expect(document.activeElement).toBe(playback);
    expect(playback.getAttribute('aria-disabled')).toBe('true');
    expect(playback.tabIndex).toBe(-1);
    expect(container.querySelector('canvas')).toBeNull();

    rerender(hero(false));
    await screen.findByRole('button', { name: 'Lichtimpuls auslösen' });
    expect(document.activeElement).toBe(playback);
  });

  it('keeps the shared playback control usable when the GPU field fails', async () => {
    lifecycle.available = false;
    const { container } = render(
      <HomePlaybackProvider>
        <HeroScene sources={heroPosterImages} />
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

  it('keeps the early pause poster through a fresh startup window and a renderer timeout', async () => {
    lifecycle.canDraw = false;
    vi.useFakeTimers();
    const { container } = render(
      <HomePlaybackProvider>
        <HeroScene sources={heroPosterImages} />
      </HomePlaybackProvider>,
    );
    const advance = (milliseconds: number) =>
      act(async () => {
        await vi.advanceTimersByTimeAsync(milliseconds);
      });
    const artwork = () => container.querySelector('#home-hero-art picture img');
    await advance(800);
    expect(artwork()?.getAttribute('src')).toMatch(/^data:/);
    fireEvent.click(screen.getByRole('button', { name: 'Animationen pausieren' }));
    await advance(2_000);
    const poster = artwork();
    expect(poster?.getAttribute('src')).toContain('/_next/image');
    expect(screen.queryByRole('status', { name: 'Grafik wird geladen' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Animationen fortsetzen' }));
    await advance(1_999);
    expect(container.querySelector('canvas')).not.toBeNull();
    expect(artwork()).toBe(poster);
    expect(screen.getByRole('status', { name: 'Grafik wird geladen' })).toBeTruthy();
    await advance(1);
    expect(container.querySelector('canvas')).toBeNull();
    expect(artwork()).toBe(poster);
    expect(screen.queryByRole('status', { name: 'Grafik wird geladen' })).toBeNull();
  });
});
