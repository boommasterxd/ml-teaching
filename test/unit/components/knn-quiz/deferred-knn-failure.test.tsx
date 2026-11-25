import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import DeferredKnnQuiz from '@/components/knn-quiz/DeferredKnnQuiz';
import { installBrowserHost, restoreBrowserHost } from '../../helpers/browser-host';

vi.mock('@/components/knn-quiz/KnnQuiz', () => {
  throw new Error('Exercise chunk unavailable');
});

beforeEach(installBrowserHost);
afterEach(() => {
  cleanup();
  restoreBrowserHost();
});

describe('KNN chunk failure', () => {
  it('explains a failed download and permits an explicit retry', async () => {
    render(<DeferredKnnQuiz />);
    const error = 'Die Übung konnte nicht geladen werden.';
    expect(screen.getByRole('status').textContent).toBe('Die Übung wird geladen …');
    expect((await screen.findByRole('alert')).textContent).toBe(error);
    expect(screen.getByRole('status').textContent).toBe('');
    const retry = screen.getByRole('button', { name: 'Erneut versuchen' });
    retry.focus();
    fireEvent.click(retry);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('Die Übung wird geladen …');
    expect(retry.getAttribute('aria-disabled')).toBe('true');
    expect(document.activeElement).toBe(retry);
    expect((await screen.findByRole('alert')).textContent).toBe(error);
    expect(document.activeElement).toBe(retry);
    expect(screen.queryByRole('slider')).toBeNull();
  });
});
