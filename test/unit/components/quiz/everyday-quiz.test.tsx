import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import EverydayQuiz from '@/components/quiz/EverydayQuiz';
import { INITIAL_QUIZ_ROUND, QUIZ_EXAMPLES } from '@/lib/recognition-quiz';
import * as quizRounds from '@/lib/recognition-quiz';
import { installBrowserHost, restoreBrowserHost } from '../../helpers/browser-host';

function currentExamples() {
  return screen.getAllByRole('button', { name: /^Auswählen:/ }).map((button) => {
    const name = button.getAttribute('aria-label');
    return QUIZ_EXAMPLES.find((example) => name === `Auswählen: ${example.title}`)!;
  });
}

function choice(title: string) {
  return screen.getByRole('button', { name: `Auswählen: ${title}` });
}

beforeEach(installBrowserHost);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  restoreBrowserHost();
});

describe('everyday recognition quiz', () => {
  it('renders six complete initial choices in static HTML without feedback or inline styles', () => {
    const markup = renderToStaticMarkup(<EverydayQuiz />);
    const document = new DOMParser().parseFromString(markup, 'text/html');
    expect(document.querySelector('[style], style, script')).toBeNull();
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const example of INITIAL_QUIZ_ROUND) {
      expect(
        buttons.some(
          (button) => button.getAttribute('aria-label') === `Auswählen: ${example.title}`,
        ),
      ).toBe(true);
      expect(document.body.textContent).toContain(example.description);
    }
    expect(document.body.textContent).toContain('0 von 3 gefunden');
    expect(document.body.textContent).not.toContain('Richtig!');
    expect(document.body.textContent).not.toContain('Hier nicht.');
    expect(
      buttons.find((button) => button.textContent?.trim() === 'Nochmal spielen')?.disabled,
    ).toBe(true);
  });

  it('hydrates the static choices without mismatches and then shows a balanced browser round', async () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<EverydayQuiz />);
    document.body.append(container);
    const failures: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, <EverydayQuiz />, {
        onRecoverableError: (error) => failures.push(error),
      });
    });
    try {
      const examples = currentExamples();
      expect(examples).toHaveLength(6);
      expect(examples.filter((example) => example.correct)).toHaveLength(3);
      expect(failures).toEqual([]);
      expect(screen.getByText('0 von 3 gefunden')).toBeTruthy();
    } finally {
      act(() => root.unmount());
      container.remove();
    }
  });

  it('explains answers while preserving the choice and focus, and counts each correct answer once', () => {
    render(<EverydayQuiz />);
    const examples = currentExamples();
    expect(examples).toHaveLength(6);
    const incorrect = examples.find((example) => !example.correct)!;
    const wrong = choice(incorrect.title);
    act(() => wrong.focus());
    fireEvent.click(wrong);
    expect(document.activeElement).toBe(wrong);
    expect(wrong.getAttribute('aria-disabled')).toBe('true');
    expect(choice(incorrect.title)).toBe(wrong);
    expect(screen.getByRole('status').textContent).toContain('Hier nicht.');
    expect(screen.getByRole('status').textContent).toContain(incorrect.explanation);
    expect(wrong.hasAttribute('aria-describedby')).toBe(false);
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(
      screen.getByRole('button', { name: `Hier nicht: ${incorrect.title}. Erklärung anzeigen` }),
    ).toBeTruthy();
    expect(screen.getByText('0 von 3 gefunden')).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Nochmal spielen' }) as HTMLButtonElement).disabled,
    ).toBe(false);

    const example = examples.find((item) => item.correct)!;
    const correct = choice(example.title);
    act(() => correct.focus());
    fireEvent.click(correct);
    fireEvent.click(correct);
    expect(document.activeElement).toBe(correct);
    expect(choice(example.title)).toBe(correct);
    expect(correct.getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('status').textContent).toContain('Richtig!');
    expect(screen.getByRole('status').textContent).toContain(example.explanation);
    expect(correct.hasAttribute('aria-describedby')).toBe(false);
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(
      screen.getByRole('button', { name: `Richtig: ${example.title}. Erklärung anzeigen` }),
    ).toBeTruthy();
    expect(screen.getByText('1 von 3 gefunden')).toBeTruthy();
  });

  it('allows exploration after completion and starts a different round with reset answers and focus', () => {
    render(<EverydayQuiz />);
    const previous = currentExamples();
    for (const example of previous.filter((item) => item.correct))
      fireEvent.click(choice(example.title));
    expect(screen.getByRole('heading', { name: 'Alle drei gefunden.' })).toBeTruthy();
    fireEvent.click(choice(previous.find((item) => !item.correct)!.title));
    expect(screen.getByRole('status').textContent).toContain('Hier nicht.');
    const replacement = QUIZ_EXAMPLES.find(
      (example) => example.correct === previous[1]!.correct && !previous.includes(example),
    )!;
    const reordered = [previous[5]!, previous[0]!, replacement, ...previous.slice(2, 5)];
    const retainedLast = choice(previous[5]!.title);
    vi.spyOn(quizRounds, 'createQuizRound').mockReturnValueOnce(reordered);
    fireEvent.click(screen.getByRole('button', { name: 'Nochmal spielen' }));
    const next = currentExamples();
    expect(next).toHaveLength(6);
    expect(next.filter((example) => example.correct)).toHaveLength(3);
    expect(choice(next[0]!.title)).toBe(retainedLast);
    expect(next.map((example) => example.id)).not.toEqual(previous.map((example) => example.id));
    expect(screen.getByText('0 von 3 gefunden')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Neue Runde. 0 von 3 gefunden.');
    expect(screen.queryByRole('heading', { name: 'Alle drei gefunden.' })).toBeNull();
    for (const example of next)
      expect(choice(example.title).getAttribute('aria-disabled')).not.toBe('true');
    expect(document.activeElement).toBe(screen.getAllByRole('button', { name: /^Auswählen:/ })[0]);
    expect(
      (screen.getByRole('button', { name: 'Nochmal spielen' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    fireEvent.click(choice(next.find((example) => example.correct)!.title));
    expect(screen.getByText('1 von 3 gefunden')).toBeTruthy();
  });
});
