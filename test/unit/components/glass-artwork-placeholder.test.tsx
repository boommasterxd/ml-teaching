import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import GlassArtworkPlaceholder from '@/components/hero/GlassArtworkPlaceholder';
import { heroPosterImages } from '@/components/hero/poster-assets';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

const loadingStatus = { name: 'Grafik wird geladen' };

function artwork(loading: boolean, fallback = false) {
  return (
    <GlassArtworkPlaceholder
      sources={heroPosterImages}
      fallback={fallback}
      loading={loading}
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
  beforeEach(installBrowserHost);
  afterEach(restoreBrowserHost);

  it('restricts the poster to reduced motion before showing loading feedback', () => {
    const { container } = render(artwork(false));
    expect(liveSources(container)).toEqual([
      '(width < 48rem) and (prefers-reduced-motion: reduce)',
      '(width >= 48rem) and (prefers-reduced-motion: reduce)',
    ]);
    expect(screen.queryByRole('status', loadingStatus)).toBeNull();
  });

  it('offers the poster during loading and hides the spinner after it decodes', async () => {
    const { container, rerender } = render(artwork(false));
    const initialMedia = liveSources(container);
    rerender(artwork(true));
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
    const { container, rerender } = render(artwork(false));
    rerender(artwork(false, true));
    expect(liveSources(container)).toEqual(['(width < 48rem)', '(width >= 48rem)']);
    expect(screen.queryByRole('status', loadingStatus)).toBeNull();
  });
});
