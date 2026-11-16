import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import TopographyField from '@/components/hero/TopographyField';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

const host = vi.hoisted(() => ({
  render: vi.fn(),
  cancel: vi.fn(),
  draw: vi.fn(),
  dispose: vi.fn(),
  animations: [] as {
    stop: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    play: ReturnType<typeof vi.fn>;
  }[],
}));
vi.mock('@/components/hero/topography-renderer', () => ({
  createTopographyRenderer: () => ({ draw: host.draw, dispose: host.dispose }),
}));
vi.mock('motion/react', async (original) => ({
  ...(await original<typeof import('motion/react')>()),
  frame: { render: host.render },
  cancelFrame: host.cancel,
  animate: () => {
    const control = {
      stop: vi.fn(),
      pause: vi.fn(),
      play: vi.fn(),
      then: () => Promise.resolve(),
    };
    host.animations.push(control);
    return control;
  },
}));
beforeEach(() => {
  installBrowserHost();
  vi.clearAllMocks();
  host.draw.mockReturnValue(true);
  host.animations = [];
});
afterEach(restoreBrowserHost);

describe('active contour field ownership', () => {
  it('freezes the same GPU image and wave controls, then continues without counting paused time', () => {
    let resize = () => {};
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resize = () => callback([], this);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const onUnavailable = vi.fn();
    const onRendered = vi.fn();
    const { container, rerender } = render(
      <TopographyField onUnavailable={onUnavailable} onRendered={onRendered} />,
    );
    const canvas = container.querySelector('canvas');
    const field = container.querySelector('.hero-field-canvas')!;
    const tick = host.render.mock.calls[0]![0] as (frame: { delta: number }) => void;
    tick({ delta: 16 });
    fireEvent(field, new MouseEvent('pointerdown', { bubbles: true, clientX: 25, clientY: 25 }));
    rerender(<TopographyField paused onUnavailable={onUnavailable} onRendered={onRendered} />);
    expect(container.querySelector('canvas')).toBe(canvas);
    expect(host.dispose).not.toHaveBeenCalled();
    expect(host.cancel).toHaveBeenCalledWith(tick);
    expect(host.animations[0]!.pause).toHaveBeenCalledTimes(1);
    const draws = host.draw.mock.calls.length;
    tick({ delta: 500 });
    fireEvent(field, new MouseEvent('pointerdown', { bubbles: true, clientX: 50, clientY: 50 }));
    expect(host.draw).toHaveBeenCalledTimes(draws);
    expect(host.animations).toHaveLength(1);
    act(() => resize());
    expect(host.draw).toHaveBeenCalledTimes(draws + 1);
    expect(host.draw.mock.lastCall![0].time).toBe(16);
    rerender(<TopographyField onUnavailable={onUnavailable} onRendered={onRendered} />);
    expect(host.animations[0]!.play).toHaveBeenCalledTimes(1);
    expect(host.render).toHaveBeenLastCalledWith(tick, true);
    tick({ delta: 500 });
    expect(host.draw.mock.lastCall![0].time).toBe(16);
    tick({ delta: 16 });
    expect(host.draw.mock.lastCall![0].time).toBe(32);
    expect(host.dispose).not.toHaveBeenCalled();
    expect(onRendered).toHaveBeenCalledTimes(1);
  });

  it('bounds raster density and waves, then cancels the frame owner and waves when retired', () => {
    vi.stubGlobal('devicePixelRatio', 4);
    const onRendered = vi.fn();
    const { container, unmount } = render(
      <TopographyField onUnavailable={vi.fn()} onRendered={onRendered} />,
    );
    expect(onRendered).toHaveBeenCalledWith(true);
    expect(host.draw.mock.calls[0]![0].dpr).toBe(1.5);
    const field = container.querySelector('.hero-field-canvas')!;
    for (let wave = 0; wave < 5; wave++)
      fireEvent(field, new MouseEvent('pointerdown', { bubbles: true, clientX: 25, clientY: 25 }));
    expect(host.animations).toHaveLength(5);
    expect(host.animations[0]!.stop).toHaveBeenCalledTimes(1);
    expect(host.animations[1]!.stop).not.toHaveBeenCalled();
    unmount();
    for (const animation of host.animations) expect(animation.stop).toHaveBeenCalledTimes(1);
    expect(host.cancel).toHaveBeenCalledWith(host.render.mock.calls[0]![0]);
    expect(host.dispose).toHaveBeenCalledTimes(1);
    expect(onRendered).toHaveBeenLastCalledWith(false);
  });

  it('stops rendering immediately on GPU context loss and requests the static fallback', async () => {
    const unavailable = vi.fn();
    const { container } = render(
      <TopographyField onUnavailable={unavailable} onRendered={vi.fn()} />,
    );
    const event = new Event('webglcontextlost', { cancelable: true });
    fireEvent(container.querySelector('canvas')!, event);
    expect(event.defaultPrevented).toBe(true);
    expect(host.cancel).toHaveBeenCalledWith(host.render.mock.calls[0]![0]);
    expect(host.dispose).toHaveBeenCalledTimes(1);
    expect(unavailable).toHaveBeenCalledTimes(1);
    const draws = host.draw.mock.calls.length;
    await act(async () => {
      document.documentElement.classList.add('dark');
    });
    expect(host.draw).toHaveBeenCalledTimes(draws);
    document.documentElement.classList.remove('dark');
  });

  it('keeps the fallback authoritative when the first GPU draw cannot run', () => {
    host.draw.mockReturnValue(false);
    const unavailable = vi.fn();
    const onRendered = vi.fn();
    render(<TopographyField onUnavailable={unavailable} onRendered={onRendered} />);
    expect(onRendered).not.toHaveBeenCalledWith(true);
    expect(onRendered).toHaveBeenCalledWith(false);
    expect(unavailable).toHaveBeenCalledTimes(1);
    expect(host.render).not.toHaveBeenCalled();
    expect(host.dispose).toHaveBeenCalledTimes(1);
  });

  it('redraws the new theme without advancing time and never polls unchanged theme colors', async () => {
    const stylesheet = document.createElement('style');
    stylesheet.textContent =
      'canvas { --hero-line-color: 201 35 55; } .dark canvas { --hero-line-color: 255 90 110; }';
    document.head.append(stylesheet);
    try {
      const styles = vi.spyOn(globalThis, 'getComputedStyle');
      const { container, unmount } = render(
        <TopographyField onUnavailable={vi.fn()} onRendered={vi.fn()} />,
      );
      const canvas = container.querySelector('canvas')!;
      const colorReads = () => styles.mock.calls.filter(([element]) => element === canvas).length;
      expect(colorReads()).toBe(1);
      const tick = host.render.mock.calls[0]![0] as (frame: { delta: number }) => void;
      for (let frame = 0; frame < 60; frame++) tick({ delta: 16 });
      expect(colorReads()).toBe(1);
      const time = host.draw.mock.lastCall![0].time;
      await act(async () => {
        document.documentElement.classList.add('dark');
      });
      expect(colorReads()).toBe(2);
      expect(host.draw.mock.lastCall![0].color).toEqual([1, 90 / 255, 110 / 255]);
      expect(host.draw.mock.lastCall![0].time).toBe(time);
      unmount();
      const draws = host.draw.mock.calls.length;
      await act(async () => {
        document.documentElement.classList.remove('dark');
      });
      expect(host.draw).toHaveBeenCalledTimes(draws);
    } finally {
      stylesheet.remove();
      document.documentElement.classList.remove('dark');
    }
  });
});
