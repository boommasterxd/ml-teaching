import { afterEach, beforeEach, it, expect, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import EverydayQuiz from '@/components/quiz/EverydayQuiz';
import { QUIZ_EXAMPLES } from '@/lib/recognition-quiz';
import { installBrowserHost, restoreBrowserHost } from '../../helpers/browser-host';

vi.mock('@/components/quiz/quiz-feedback', () => {
  throw new Error('Feedback chunk unavailable');
});

beforeEach(installBrowserHost);
afterEach(() => {
  cleanup();
  restoreBrowserHost();
});

it('keeps the answer visible and provides a focus-safe retry when feedback fails to load', async () => {
  render(<EverydayQuiz />);
  const choice = screen.getAllByRole('button', { name: /^Auswählen:/ })[0];
  const example = QUIZ_EXAMPLES.find(
    ({ title }) => choice.getAttribute('aria-label') === `Auswählen: ${title}`,
  )!;
  act(() => choice.focus());
  fireEvent.click(choice);

  const fallback = within(screen.getByRole('group', { name: 'Rückmeldung' }));
  expect(fallback.getByText(example.correct ? 'Richtig!' : 'Hier nicht.')).toBeTruthy();
  expect(fallback.getByText(example.explanation)).toBeTruthy();
  expect(screen.getByRole('status').textContent).toContain(example.explanation);
  expect(screen.queryByRole('alert')).toBeNull();

  const retryButton = { name: 'Rückmeldung erneut laden' };
  const retry = await fallback.findByRole('button', retryButton);
  act(() => retry.focus());
  fireEvent.click(retry);
  expect(document.activeElement).toBe(choice);
  expect(fallback.queryByRole('button', retryButton)).toBeNull();
  expect(await fallback.findByRole('button', retryButton)).toBeTruthy();
});
