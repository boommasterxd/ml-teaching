import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ImageHeroArtwork from '@/components/image-hero/ImageHeroArtwork';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

beforeEach(installBrowserHost);
afterEach(restoreBrowserHost);

describe('image-learning hero animation controls', () => {
  it('pauses and resumes through the same focused control', () => {
    render(<ImageHeroArtwork />);
    const control = screen.getByRole('button', { name: 'Animation pausieren' });
    control.focus();
    expect(control.hasAttribute('aria-pressed')).toBe(false);

    fireEvent.click(control);
    expect(screen.getByRole('button', { name: 'Animation fortsetzen' })).toBe(control);
    expect(control.hasAttribute('aria-pressed')).toBe(false);
    expect(document.activeElement).toBe(control);

    fireEvent.click(control);
    expect(screen.getByRole('button', { name: 'Animation pausieren' })).toBe(control);
    expect(document.activeElement).toBe(control);
  });

  it('respects the browser motion preference and explains the unavailable animation control', () => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    vi.mocked(window.matchMedia).mockImplementation((query) => ({
      ...media,
      media: query,
      matches: query === '(prefers-reduced-motion: reduce)',
    }));
    render(<ImageHeroArtwork />);
    const control = screen.getByRole('button', { name: 'Bewegung reduziert' });
    expect(control.hasAttribute('disabled')).toBe(true);
    fireEvent.click(control);
    expect(screen.getByRole('button', { name: 'Bewegung reduziert' })).toBe(control);
  });
});
