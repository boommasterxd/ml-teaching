import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useKnnQuiz } from '@/components/knn-quiz/useKnnQuiz';
import EverydayQuiz from '@/components/quiz/EverydayQuiz';
import { INITIAL_QUIZ_ROUND } from '@/lib/recognition-quiz';

afterEach(() => vi.unstubAllGlobals());

it('judges nearest points and explains both majority votes and ties', () => {
  const { result } = renderHook(useKnnQuiz);
  const { points, query } = result.current.round;
  const distance = ({ x, y }: { x: number; y: number }) => Math.hypot(x - query.x, y - query.y);
  const ranked = points.toSorted((left, right) => distance(left) - distance(right));
  const closest = ranked.slice(0, 3);
  const majority = closest.filter(({ signal }) => signal === 'dog').length === 2 ? 'dog' : 'cat';

  act(() => result.current.choosePoint(ranked[3].id));
  expect(result.current.selected).toEqual([]);
  expect(result.current.announcement).toContain('gehört nicht');
  act(() => result.current.chooseClass(majority));
  expect(result.current.result).toBeNull();

  act(() => closest.forEach(({ id }) => result.current.choosePoint(id)));
  act(() => result.current.chooseClass(majority === 'dog' ? 'cat' : 'dog'));
  expect(result.current.result).toBe('incorrect');
  act(() => result.current.chooseClass(majority));
  expect(result.current.result).toBe('correct');
  expect(result.current.announcement).toBe(
    '2 von 3 Nachbarn stimmen für ' + (majority === 'dog' ? 'Hund.' : 'Katze.'),
  );

  act(() => result.current.changeK(2));
  expect(result.current.selected).toEqual([]);
  act(() => closest.slice(0, 2).forEach(({ id }) => result.current.choosePoint(id)));
  act(() => result.current.chooseClass(null));
  expect(result.current.result).toBe('correct');
  expect(result.current.announcement).toBe('Hund und Katze haben je 1 Stimme.');
});

it('explains everyday examples, counts a correct choice once, and offers a fresh round', async () => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  class Observer {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('IntersectionObserver', Observer);
  vi.stubGlobal('ResizeObserver', Observer);
  render(<EverydayQuiz />);
  const answer = (title: string) =>
    fireEvent.click(screen.getByRole('button', { name: `Auswählen: ${title}` }));
  const wrong = INITIAL_QUIZ_ROUND.find(({ correct }) => !correct)!;
  answer(wrong.title);
  expect(screen.getByRole('status').textContent).toContain(wrong.explanation);
  expect(screen.getByText('0 von 3 gefunden')).toBeTruthy();

  const correct = INITIAL_QUIZ_ROUND.filter((example) => example.correct);
  answer(correct[0].title);
  answer(correct[0].title);
  expect(screen.getByText('1 von 3 gefunden')).toBeTruthy();
  for (const example of correct.slice(1)) answer(example.title);
  expect(await screen.findByRole('heading', { name: 'Alle drei gefunden.' })).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Nochmal spielen' }));
  expect(screen.getByText('0 von 3 gefunden')).toBeTruthy();
  const choices = screen.getAllByRole('button', { name: /^Auswählen:/ });
  expect(choices).toHaveLength(6);
  expect(
    choices.some((choice) =>
      INITIAL_QUIZ_ROUND.every(
        ({ title }) => choice.getAttribute('aria-label') !== 'Auswählen: ' + title,
      ),
    ),
  ).toBe(true);
});
