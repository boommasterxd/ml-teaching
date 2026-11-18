import { fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import RewardExperiment from '@/components/home/RewardExperiment';
import { installBrowserHost, restoreBrowserHost } from '../../helpers/browser-host';

beforeEach(installBrowserHost);
afterEach(restoreBrowserHost);

describe('interactive reward experiment', () => {
  it('provides a complete style-free static illustration before interaction', () => {
    const markup = renderToStaticMarkup(<RewardExperiment />);
    const document = new DOMParser().parseFromString(markup, 'text/html');
    expect(document.querySelector('[style], style, script')).toBeNull();
    expect(document.querySelector('svg desc')?.textContent).toContain('startet links unten');
    expect(document.querySelectorAll('button')).toHaveLength(3);
  });

  it('changes the destination with its reward and resets without losing the action focus', () => {
    render(<RewardExperiment />);
    const star = screen.getByRole('button', { name: 'Stern belohnen' });
    const treasure = screen.getByRole('button', { name: 'Schatz belohnen' });
    const reset = screen.getByRole('button', { name: 'Zurücksetzen' });
    expect(reset.hasAttribute('disabled')).toBe(true);

    star.focus();
    fireEvent.click(star);
    expect(document.activeElement).toBe(star);
    expect(screen.getByRole('status').textContent).toContain('Stern: +10 Belohnung · 7 Schritte');
    expect(screen.getByRole('img').textContent).toContain('Beispielweg zum Stern');

    treasure.focus();
    fireEvent.click(treasure);
    expect(document.activeElement).toBe(treasure);
    expect(screen.getByRole('status').textContent).toContain('Schatz: +10 Belohnung · 6 Schritte');
    expect(screen.getByRole('img').textContent).toContain('Beispielweg zum Schatz');
    fireEvent.click(treasure);
    expect(screen.getByRole('status').textContent).toContain('Schatz: +10 Belohnung');

    reset.focus();
    fireEvent.click(reset);
    expect(document.activeElement).toBe(star);
    expect(screen.getByRole('status').textContent).toContain('Noch kein Ziel belohnt');
    expect(screen.getByRole('img').textContent).toContain('startet links unten');
    expect(reset.hasAttribute('disabled')).toBe(true);
  });
});
