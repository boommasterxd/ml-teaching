import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GlassArtworkPlaceholder from '@/components/hero/GlassArtworkPlaceholder';
import { heroPosterImages } from '@/components/hero/poster-assets';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

const loadingStatus = { name: 'Grafik wird geladen' };

function artwork(pending: boolean) {
  return <GlassArtworkPlaceholder sources={heroPosterImages} fallback={false} pending={pending} />;
}

describe('glass artwork loading feedback', () => {
  beforeEach(() => {
    installBrowserHost();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    restoreBrowserHost();
  });

  it('skips the spinner when the first frame arrives before the delay', () => {
    const { rerender } = render(artwork(true));
    act(() => vi.advanceTimersByTime(499));
    expect(screen.queryByRole('status', loadingStatus)).toBeNull();

    rerender(artwork(false));
    act(() => vi.advanceTimersByTime(500));
    expect(screen.queryByRole('status', loadingStatus)).toBeNull();
  });

  it('shows the spinner after 500 ms and removes it as soon as loading ends', () => {
    const { rerender } = render(artwork(true));
    act(() => vi.advanceTimersByTime(499));
    expect(screen.queryByRole('status', loadingStatus)).toBeNull();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('status', loadingStatus)).toBeTruthy();

    rerender(artwork(false));
    expect(screen.queryByRole('status', loadingStatus)).toBeNull();
  });
});
