import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NeuralNetViz from '@/components/NeuralNetViz';
import { ANIMATION } from '@/constants';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

beforeEach(() => {
  installBrowserHost();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  restoreBrowserHost();
});

describe('educational network demo', () => {
  it('runs one user-selected example at a time and can demonstrate both output classes', async () => {
    render(<NeuralNetViz />);
    const dog = screen.getByRole('button', { name: 'Hundebild zeigen' });
    const cat = screen.getByRole('button', { name: 'Katzenbild zeigen' });
    fireEvent.click(dog);
    expect((dog as HTMLButtonElement).disabled).toBe(true);
    expect((cat as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Verarbeite Signal...')).toBeTruthy();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ANIMATION.STEP_DURATION_MS * 7);
    });
    expect(screen.getByText('Hund erkannt (98%)')).toBeTruthy();
    expect((cat as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(cat);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ANIMATION.STEP_DURATION_MS * 7);
    });
    expect(screen.getByText('Katze erkannt (95%)')).toBeTruthy();
    expect((dog as HTMLButtonElement).disabled).toBe(false);
  });
});
