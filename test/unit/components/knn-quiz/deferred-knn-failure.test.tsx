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
    expect(await screen.findByText('Die Übung konnte nicht geladen werden.')).toBeTruthy();
    const retry = screen.getByRole('button', { name: 'Erneut versuchen' });
    retry.focus();
    fireEvent.click(retry);
    expect(screen.queryByText('Die Übung konnte nicht geladen werden.')).toBeNull();
    expect(await screen.findByText('Die Übung konnte nicht geladen werden.')).toBeTruthy();
    expect(document.activeElement).toBe(retry);
    expect(screen.queryByRole('slider')).toBeNull();
  });
});
