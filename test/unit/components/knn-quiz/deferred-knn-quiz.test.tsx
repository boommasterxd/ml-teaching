import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import DeferredKnnQuiz from '@/components/knn-quiz/DeferredKnnQuiz';
import { installBrowserHost, restoreBrowserHost } from '../../helpers/browser-host';

let updateViewport: (visible: boolean) => void;
let disconnect: ReturnType<typeof vi.fn>;

beforeEach(() => {
  installBrowserHost();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe(target: Element) {
        if (!target.textContent?.includes('KNN selbst ausprobieren')) return;
        disconnect = this.disconnect;
        updateViewport = (isIntersecting) =>
          this.callback(
            [{ isIntersecting }] as IntersectionObserverEntry[],
            this as unknown as IntersectionObserver,
          );
      }
      disconnect = vi.fn();
    },
  );
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
    expect(await screen.findByRole('slider')).toBeTruthy();
    expect(screen.getByText('K = 3 · 0 von 3 gefunden')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Übung öffnen' })).toBeNull();
  });

  it('opens when approaching the viewport and disconnects its observer on cleanup', async () => {
    const { unmount } = render(<DeferredKnnQuiz />);
    act(() => updateViewport(false));
    expect(screen.queryByRole('slider')).toBeNull();
    await act(async () => updateViewport(true));
    expect(await screen.findByRole('slider')).toBeTruthy();
    expect(disconnect).toHaveBeenCalledOnce();
    unmount();
    expect(disconnect).toHaveBeenCalledTimes(2);
  });
});
