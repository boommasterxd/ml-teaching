import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import EverydayQuiz from '@/components/quiz/EverydayQuiz';
import { installBrowserHost, restoreBrowserHost } from '../../helpers/browser-host';

const choices = [
  'Katzen in Fotos finden',
  'Sprachnachrichten abtippen',
  'Verkehrsschilder erkennen',
  '12 × 8 ausrechnen',
  'Text aus einem Foto lesen',
  'Einen Timer stellen',
];

beforeEach(installBrowserHost);
afterEach(() => {
  cleanup();
  restoreBrowserHost();
});

describe('everyday recognition quiz', () => {
  it('renders all initial choices in static HTML without feedback or inline styles', () => {
    const markup = renderToStaticMarkup(<EverydayQuiz />);
    const document = new DOMParser().parseFromString(markup, 'text/html');
    expect(document.querySelector('[style], style, script')).toBeNull();
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const name of choices) {
      expect(
        buttons.some((button) => button.getAttribute('aria-label') === `Auswählen: ${name}`),
      ).toBe(true);
    }
    expect(document.body.textContent).toContain('0 von 3 gefunden');
    expect(document.body.textContent).not.toContain('Richtig!');
    expect(document.body.textContent).not.toContain('Hier nicht.');
    expect(
      buttons.find((button) => button.textContent?.trim() === 'Nochmal spielen')?.disabled,
    ).toBe(true);
  });

  it('explains answers while preserving the choice and focus, and counts each correct answer once', () => {
    render(<EverydayQuiz />);
    const wrong = screen.getByRole('button', { name: `Auswählen: ${choices[1]}` });
    act(() => wrong.focus());
    fireEvent.click(wrong);
    expect(document.activeElement).toBe(wrong);
    expect(wrong.getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('button', { name: `Auswählen: ${choices[1]}` })).toBe(wrong);
    expect(screen.getByRole('status').textContent).toContain('Hier nicht.');
    expect(screen.getByRole('status').textContent).toContain('Hier wird Ton ausgewertet.');
    expect(screen.getByRole('status').textContent).toContain('Spracherkennung');
    expect(wrong.hasAttribute('aria-describedby')).toBe(false);
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(
      screen.getByRole('button', { name: `Hier nicht: ${choices[1]}. Erklärung anzeigen` }),
    ).toBeTruthy();
    expect(screen.getByText('0 von 3 gefunden')).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Nochmal spielen' }) as HTMLButtonElement).disabled,
    ).toBe(false);

    const correct = screen.getByRole('button', { name: `Auswählen: ${choices[0]}` });
    act(() => correct.focus());
    fireEvent.click(correct);
    fireEvent.click(correct);
    expect(document.activeElement).toBe(correct);
    expect(screen.getByRole('button', { name: `Auswählen: ${choices[0]}` })).toBe(correct);
    expect(correct.getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('status').textContent).toContain('Richtig!');
    expect(screen.getByRole('status').textContent).toContain('sichtbaren Merkmalen');
    expect(correct.hasAttribute('aria-describedby')).toBe(false);
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(
      screen.getByRole('button', { name: `Richtig: ${choices[0]}. Erklärung anzeigen` }),
    ).toBeTruthy();
    expect(screen.getByText('1 von 3 gefunden')).toBeTruthy();
  });

  it('allows exploration after completion and resets all answers with focus on the first choice', () => {
    render(<EverydayQuiz />);
    for (const index of [0, 2, 4])
      fireEvent.click(screen.getByRole('button', { name: `Auswählen: ${choices[index]}` }));
    expect(screen.getByRole('heading', { name: 'Alle drei gefunden.' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: `Auswählen: ${choices[5]}` }));
    expect(screen.getByRole('status').textContent).toContain('Hier nicht.');
    fireEvent.click(screen.getByRole('button', { name: 'Nochmal spielen' }));
    expect(screen.getByText('0 von 3 gefunden')).toBeTruthy();
    expect(screen.getByRole('status').textContent).not.toContain('Richtig!');
    expect(screen.getByRole('status').textContent).not.toContain('Hier nicht.');
    expect(screen.queryByRole('heading', { name: 'Alle drei gefunden.' })).toBeNull();
    for (const name of choices) {
      expect(
        screen.getByRole('button', { name: `Auswählen: ${name}` }).getAttribute('aria-disabled'),
      ).not.toBe('true');
    }
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: `Auswählen: ${choices[0]}` }),
    );
    expect(
      (screen.getByRole('button', { name: 'Nochmal spielen' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: `Auswählen: ${choices[0]}` }));
    expect(screen.getByText('1 von 3 gefunden')).toBeTruthy();
  });
});
