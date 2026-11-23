import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
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
  it('prepares on keyboard intent without opening and opens through the explicit control', async () => {
    render(<DeferredKnnQuiz />);
    const open = screen.getByRole('button', { name: 'Übung öffnen' });
    await act(async () => {
      open.focus();
      await vi.dynamicImportSettled();
    });
    expect(screen.queryByRole('slider')).toBeNull();
    expect(screen.getByRole('button', { name: 'Übung öffnen' })).toBe(open);
    expect(document.activeElement).toBe(open);
    fireEvent.click(open);
    const title = await screen.findByRole('heading', { name: 'Hund oder Katze?' });
    expect(document.activeElement).toBe(title);
    expect(screen.getByText('K = 3 · 0 von 3 gefunden')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Übung öffnen' })).toBeNull();
  });
});
