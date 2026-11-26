import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GlassArtworkPlaceholder from '@/components/hero/GlassArtworkPlaceholder';
import { heroPosterImages } from '@/components/hero/poster-assets';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

const loadingStatus = { name: 'Grafik wird geladen' };

function artwork(pending: boolean, fallback = false) {
  return (
    <GlassArtworkPlaceholder
      sources={heroPosterImages}
      fallback={fallback}
      pending={pending}
      shaderFirst
    />
  );
}

function liveSources(container: HTMLElement) {
  return Array.from(container.querySelectorAll(':scope > picture source'), (source) =>
    source.getAttribute('media'),
  );
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

  it('keeps the poster restricted to reduced motion when the first frame is prompt', () => {
    const { container, rerender } = render(artwork(true));
    const initialMedia = liveSources(container);
    expect(initialMedia).toEqual([
      '(width < 48rem) and (prefers-reduced-motion: reduce)',
      '(width >= 48rem) and (prefers-reduced-motion: reduce)',
    ]);
    act(() => vi.advanceTimersByTime(499));
    expect(screen.queryByRole('status', loadingStatus)).toBeNull();
    expect(liveSources(container)).toEqual(initialMedia);

    rerender(artwork(false));
    act(() => vi.advanceTimersByTime(500));
    expect(screen.queryByRole('status', loadingStatus)).toBeNull();
    expect(liveSources(container)).toEqual(initialMedia);
  });

  it('offers the poster at 500 ms and stops waiting visually after it decodes', async () => {
    const { container, rerender } = render(artwork(true));
    const initialMedia = liveSources(container);
    act(() => vi.advanceTimersByTime(499));
    expect(screen.queryByRole('status', loadingStatus)).toBeNull();
    expect(liveSources(container)).toEqual(initialMedia);

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('status', loadingStatus)).toBeTruthy();
    expect(liveSources(container)).toEqual(['(width < 48rem)', '(width >= 48rem)']);

    const poster = container.querySelector('picture img');
    if (!poster) throw new Error('The responsive artwork has no image.');
    const decoding = Promise.withResolvers<void>();
    Object.defineProperties(poster, {
      naturalWidth: { value: 615 },
      currentSrc: { value: heroPosterImages.mobile.src },
      decode: { value: () => decoding.promise },
    });
    fireEvent.load(poster);
    expect(screen.getByRole('status', loadingStatus)).toBeTruthy();
    await act(async () => decoding.resolve());
    expect(screen.queryByRole('status', loadingStatus)).toBeNull();
    expect(liveSources(container)).toEqual(['(width < 48rem)', '(width >= 48rem)']);

    rerender(artwork(false));
    expect(screen.queryByRole('status', loadingStatus)).toBeNull();
    expect(liveSources(container)).toEqual(initialMedia);
  });

  it('offers the poster without showing a spinner after an immediate failure', () => {
    const { container, rerender } = render(artwork(true));
    act(() => vi.advanceTimersByTime(100));
    rerender(artwork(false, true));
    expect(liveSources(container)).toEqual(['(width < 48rem)', '(width >= 48rem)']);
    act(() => vi.advanceTimersByTime(500));
    expect(screen.queryByRole('status', loadingStatus)).toBeNull();
  });
});
