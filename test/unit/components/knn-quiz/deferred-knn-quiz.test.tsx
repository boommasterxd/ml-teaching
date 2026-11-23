import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import DeferredKnnQuiz from '@/components/knn-quiz/DeferredKnnQuiz';
import {
  installBrowserHost,
  installSliderLayout,
  restoreBrowserHost,
} from '../../helpers/browser-host';

beforeEach(() => {
  installBrowserHost();
  installSliderLayout();
});
afterEach(() => {
  cleanup();
  restoreBrowserHost();
});

describe('deferred KNN exercise', () => {
  it('starts automatically when the exercise is near the viewport', async () => {
    render(<DeferredKnnQuiz />);
    expect(screen.getByRole('status').textContent).toBe('Die Übung wird geladen …');
    expect(screen.queryByRole('slider')).toBeNull();
    expect(await screen.findByRole('slider')).toBeTruthy();
    expect(screen.getByText('K = 3 · 0 von 3 gefunden')).toBeTruthy();
    expect(document.activeElement).toBe(document.body);
  });
});
