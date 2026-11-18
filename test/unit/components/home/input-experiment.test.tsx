import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePlaybackProvider, useHomePlayback } from '@/components/home/HomePlaybackProvider';
import InputExperiment from '@/components/home/InputExperiment';
import { PreviewCycleProvider } from '@/components/home/PreviewCycle';
import { RewardPreview } from '@/components/home/RewardExperiment';
import { prepareExample } from '@/components/network/prepare-example';
import { installBrowserHost, restoreBrowserHost } from '../../helpers/browser-host';

vi.mock('@/components/network/prepare-example', () => ({
  prepareExample: vi.fn(() => Promise.resolve()),
}));

const activePreview = '[data-preview-active="true"]';

function PauseControl() {
  const { paused, togglePause } = useHomePlayback();
  return <button onClick={togglePause}>{paused ? 'Resume' : 'Pause'}</button>;
}

function PreviewHost({ children }: { children: ReactNode }) {
  return (
    <HomePlaybackProvider>
      <PreviewCycleProvider>{children}</PreviewCycleProvider>
    </HomePlaybackProvider>
  );
}

function advancePreview(milliseconds = 4_000) {
  act(() => vi.advanceTimersByTime(milliseconds));
}

function expectPhoto(label: 'Katze' | 'Hund', filename: 'cat' | 'dog') {
  const preview = screen.getByRole('img', { name: 'Bilderkennung anhand von Bildmerkmalen' });
  const current = preview.querySelector('[data-current-example="true"]');
  expect(current?.querySelector('.home-signal-output')?.textContent).toBe(label);
  expect(current?.querySelector('img')?.getAttribute('src')).toContain(filename);
}

beforeEach(() => {
  vi.mocked(prepareExample).mockClear();
  installBrowserHost();
});
afterEach(() => {
  vi.useRealTimers();
  restoreBrowserHost();
});

describe('homepage input preview', () => {
  it('delivers style-free initial previews with the cat and an unselected reward board', () => {
    const document = new DOMParser().parseFromString(
      renderToStaticMarkup(
        <PreviewHost>
          <InputExperiment />
          <RewardPreview />
        </PreviewHost>,
      ),
      'text/html',
    );
    expect(document.querySelector('[style], style, script')).toBeNull();
    expect(document.querySelector('img')?.getAttribute('src')).toContain('cat');
    expect(document.querySelector('svg desc')?.textContent).toContain(
      'ein Hundebild der Klasse Hund',
    );
    expect(document.querySelector('[data-rewarded="true"]')).toBeNull();
    expect(document.querySelector('.reward-experiment-route')).toBeNull();
    expect(document.querySelector('.reward-experiment-traveler')).toBeNull();
  });

  it('waits for the delayed dog photo before starting the first four-second turn', async () => {
    vi.useFakeTimers();
    const photo = Promise.withResolvers<void>();
    vi.mocked(prepareExample).mockReturnValueOnce(photo.promise);
    const { container } = render(
      <>
        <InputExperiment />
        <RewardPreview />
      </>,
      { wrapper: PreviewHost },
    );
    expect(prepareExample).toHaveBeenCalledWith('dog');
    advancePreview();
    expectPhoto('Katze', 'cat');
    expect(container.querySelector(activePreview)).toBeNull();

    await act(async () => photo.resolve());
    expectPhoto('Hund', 'dog');
    expect(container.querySelector(`${activePreview}.home-signal-active`)).not.toBeNull();
    advancePreview(3_999);
    expect(container.querySelector('.reward-experiment-route')).toBeNull();
    advancePreview(1);
    expect(container.querySelector(`${activePreview}.home-signal-active`)).toBeNull();
    expect(container.querySelector(`${activePreview} .reward-experiment-traveler`)).not.toBeNull();
    expectPhoto('Hund', 'dog');
  });

  it('continues to the reward animation when the dog photo cannot be decoded', async () => {
    vi.useFakeTimers();
    const photo = Promise.withResolvers<void>();
    vi.mocked(prepareExample).mockReturnValueOnce(photo.promise);
    const { container } = render(
      <>
        <InputExperiment />
        <RewardPreview />
      </>,
      { wrapper: PreviewHost },
    );
    await act(async () => photo.reject(new Error('Example image unavailable')));

    advancePreview();
    expectPhoto('Katze', 'cat');
    expect(container.querySelector(`${activePreview} .reward-experiment-traveler`)).not.toBeNull();
  });

  it('freezes the current result when paused or out of view and resumes on return', async () => {
    vi.useFakeTimers();
    let setInView: (visible: boolean) => void = () => {};
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private readonly notify: IntersectionObserverCallback) {}
        observe(target: Element) {
          if (!target.classList.contains('home-input-experiment')) return;
          setInView = (visible) =>
            this.notify(
              [
                { target, isIntersecting: visible, intersectionRatio: Number(visible) },
              ] as IntersectionObserverEntry[],
              this as unknown as IntersectionObserver,
            );
        }
        unobserve() {}
        disconnect() {}
      },
    );
    const { container } = render(
      <>
        <InputExperiment />
        <PauseControl />
      </>,
      { wrapper: PreviewHost },
    );
    advancePreview();
    expectPhoto('Katze', 'cat');
    await act(async () => setInView(true));
    expectPhoto('Hund', 'dog');
    expect(container.querySelector(activePreview)).not.toBeNull();
    act(() => setInView(false));
    expect(container.querySelector('.home-signal-active')).toBeNull();
    advancePreview();
    expectPhoto('Hund', 'dog');

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    act(() => setInView(true));
    advancePreview();
    expectPhoto('Hund', 'dog');
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    advancePreview();
    expectPhoto('Katze', 'cat');
    expect(container.querySelector(activePreview)).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(container.querySelector('.home-signal-active')).toBeNull();
  });

  it('starts the visible reward board without waiting for the offscreen image preview', () => {
    vi.useFakeTimers();
    const { container } = render(<RewardPreview />, { wrapper: PreviewHost });
    expect(
      container.querySelector(`${activePreview} [data-goal="star"][data-rewarded="true"]`),
    ).not.toBeNull();
    advancePreview();
    expect(
      container.querySelector(`${activePreview} [data-goal="treasure"][data-rewarded="true"]`),
    ).not.toBeNull();
    expect(prepareExample).not.toHaveBeenCalled();
  });

  it('keeps the initial example when the user prefers reduced motion', () => {
    vi.useFakeTimers();
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    vi.mocked(window.matchMedia).mockReturnValue({ ...media, matches: true });
    const { container } = render(<InputExperiment />, { wrapper: PreviewHost });
    advancePreview();
    expectPhoto('Katze', 'cat');
    expect(container.querySelector('.home-signal-active')).toBeNull();
    expect(prepareExample).not.toHaveBeenCalled();
  });
});
