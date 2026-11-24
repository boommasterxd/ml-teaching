import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import TopographyField from '@/components/hero/TopographyField';
import { installBrowserHost, restoreBrowserHost } from '../helpers/browser-host';

const host = vi.hoisted(() => ({
  render: vi.fn(),
  cancel: vi.fn(),
  draw: vi.fn(),
  dispose: vi.fn(),
  rippleCapacity: 8,
  animations: [] as {
    finish: () => void;
    stop: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    play: ReturnType<typeof vi.fn>;
  }[],
}));
vi.mock('@/components/hero/topography-renderer', () => ({
  createTopographyRenderer: () => ({
    draw: host.draw,
    dispose: host.dispose,
    maxRasterDimension: 8192,
    rippleCapacity: host.rippleCapacity,
  }),
}));
vi.mock('motion/react', async (original) => ({
  ...(await original<typeof import('motion/react')>()),
  frame: { render: host.render },
  cancelFrame: host.cancel,
  animate: () => {
    const completion = Promise.withResolvers<void>();
    const control = {
      finish: completion.resolve,
      stop: vi.fn(),
      pause: vi.fn(),
      play: vi.fn(),
      then: completion.promise.then.bind(completion.promise),
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
  host.rippleCapacity = 8;
});
afterEach(restoreBrowserHost);

function activeFrame() {
  return host.render.mock.calls[0]![0] as (frame: { timestamp: number }) => void;
}

async function finishGlassWaves(first: number, end?: number) {
  await act(async () => {
    for (const wave of host.animations.slice(first, end)) wave.finish();
  });
}

describe('active glass field ownership', () => {
  it('bounds raster memory and GPU dimensions through mobile, 4K and ultrawide resizing', () => {
    vi.stubGlobal('devicePixelRatio', 4);
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
    const rect = { width: 390, height: 844, left: 0, top: 0 };
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => rect as DOMRect,
    );
    const { container } = render(<TopographyField onUnavailable={vi.fn()} onRendered={vi.fn()} />);
    const canvas = container.querySelector('canvas')!;
    expect([canvas.width, canvas.height]).toEqual([195, 422]);
    rect.width = 3840;
    rect.height = 2160;
    act(resize);
    expect(canvas.width * canvas.height).toBeLessThanOrEqual(2_073_600);
    expect(host.draw.mock.lastCall![0].width).toBe(3840);
    expect(host.draw.mock.lastCall![0].height).toBe(2160);
    rect.width = 15360;
    rect.height = 1080;
    act(resize);
    expect(canvas.width * canvas.height).toBeLessThanOrEqual(2_073_600);
    const tick = activeFrame();
    for (let index = 0; index <= 150; index++) tick({ timestamp: (index * 1000) / 30 });
    expect(canvas.width).toBe(8192);
    expect(canvas.width * canvas.height).toBeLessThanOrEqual(8_294_400);
    expect(host.draw.mock.lastCall![0].width).toBe(15360);
  });

  it('starts a wave at the tapped glass or at its center for keyboard activation', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 20, y: 10, width: 400, height: 320 }),
    );
    render(<TopographyField onUnavailable={vi.fn()} onRendered={vi.fn()} />);
    const glass = screen.getByRole('button', { name: 'Lichtimpuls im Glas auslösen' });
    const tick = activeFrame();
    fireEvent.pointerDown(glass, { pointerType: 'touch' });
    fireEvent.pointerCancel(glass, { pointerType: 'touch' });
    expect(host.animations).toHaveLength(0);
    fireEvent.click(glass, { detail: 1, clientX: 75, clientY: 250 });
    fireEvent.click(glass, { detail: 0 });
    tick({ timestamp: 16 });
    expect(Array.from(host.draw.mock.lastCall![0].ripples.slice(0, 8))).toEqual([
      55, 240, 0, 1, 200, 160, 0, 1,
    ]);
    vi.spyOn(window, 'getSelection').mockReturnValue({ isCollapsed: false } as Selection);
    fireEvent.click(glass, { detail: 1 });
    expect(host.animations).toHaveLength(2);
  });

  it('paces autonomous GPU work by scene time and draws each display frame during an impulse', () => {
    render(<TopographyField onUnavailable={vi.fn()} onRendered={vi.fn()} />);
    const tick = activeFrame();
    for (let i = 0; i <= 120; i++) tick({ timestamp: (1000 * i) / 120 });
    expect(host.draw).toHaveBeenCalledTimes(31);
    expect(host.draw.mock.lastCall![0].time).toBe(1000);
    fireEvent.click(screen.getByRole('button', { name: 'Lichtimpuls im Glas auslösen' }));
    for (const timestamp of [1008, 1016, 1024]) tick({ timestamp });
    expect(host.draw.mock.calls.slice(-3).map(([frame]) => frame.time)).toEqual([1008, 1016, 1024]);
  });

  it.each([false, true])(
    'adjusts both passes around sustained load with desktop start %s',
    (desktop) => {
      vi.stubGlobal('devicePixelRatio', 3);
      const match = vi.mocked(window.matchMedia);
      const media = match.getMockImplementation()!;
      match.mockImplementation((query) => {
        const result = media(query);
        return { ...result, matches: desktop && query === '(width >= 48rem)' };
      });
      vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(
        DOMRect.fromRect({ width: 580, height: 550 }),
      );
      const { container } = render(
        <TopographyField sharpDesktopStart onUnavailable={vi.fn()} onRendered={vi.fn()} />,
      );
      const canvas = container.querySelector('canvas')!;
      const tick = activeFrame();
      let timestamp = 0;
      const runFrames = (count: number, interval: number) => {
        act(() => {
          for (let index = 0; index < count; index++) {
            timestamp += interval;
            tick({ timestamp });
          }
        });
      };
      const lastDetail = () => host.draw.mock.lastCall![0].fieldScale;
      expect(canvas.width).toBe(desktop ? 1160 : 290);
      expect(lastDetail()).toBe(desktop ? 1.35 : 0.4);
      runFrames(253, 16);
      expect(canvas.width).toBe(1740);
      expect(lastDetail()).toBe(1.7);
      runFrames(19, 55);
      expect(canvas.width).toBe(1160);
      expect(lastDetail()).toBe(1.35);
      runFrames(19, 55);
      expect(canvas.width).toBe(870);
      expect(lastDetail()).toBe(1);
      runFrames(19, 55);
      expect(canvas.width).toBe(464);
      expect(lastDetail()).toBe(0.65);
      runFrames(19, 55);
      expect(canvas.width).toBe(290);
      expect(lastDetail()).toBe(0.4);
      runFrames(220, 16);
      expect(canvas.width).toBe(290);
      expect(lastDetail()).toBe(0.4);
      runFrames(430, 16);
      expect(canvas.width).toBe(1740);
      expect(lastDetail()).toBe(1.7);
    },
  );

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
    const field = screen.getByRole('button', { name: 'Lichtimpuls im Glas auslösen' });
    const tick = activeFrame();
    tick({ timestamp: 100 });
    tick({ timestamp: 134 });
    tick({ timestamp: 150 });
    fireEvent.click(field, { detail: 1, clientX: 25, clientY: 25 });
    rerender(<TopographyField paused onUnavailable={onUnavailable} onRendered={onRendered} />);
    expect(container.querySelector('canvas')).toBe(canvas);
    expect(host.dispose).not.toHaveBeenCalled();
    expect(host.cancel).toHaveBeenCalledWith(tick);
    expect(host.animations[0]!.pause).toHaveBeenCalledTimes(1);
    const draws = host.draw.mock.calls.length;
    tick({ timestamp: 500 });
    fireEvent.click(field, { detail: 1, clientX: 50, clientY: 50 });
    expect(host.draw).toHaveBeenCalledTimes(draws);
    expect(host.animations).toHaveLength(1);
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ width: 430, height: 350 }),
    );
    act(() => resize());
    expect(host.draw).toHaveBeenCalledTimes(draws + 1);
    expect(host.draw.mock.lastCall![0].time).toBe(34);
    const pausedWidth = canvas!.width;
    rerender(
      <TopographyField
        paused
        inView={false}
        onUnavailable={onUnavailable}
        onRendered={onRendered}
      />,
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ width: 460, height: 370 }),
    );
    act(resize);
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ width: 490, height: 390 }),
    );
    act(resize);
    expect(canvas!.width).toBe(pausedWidth);
    expect(host.draw).toHaveBeenCalledTimes(draws + 1);
    rerender(<TopographyField paused onUnavailable={onUnavailable} onRendered={onRendered} />);
    expect(container.querySelector('canvas')).toBe(canvas);
    expect(host.draw).toHaveBeenCalledTimes(draws + 2);
    expect(host.draw.mock.lastCall![0]).toMatchObject({ width: 490, height: 390, time: 34 });
    rerender(<TopographyField onUnavailable={onUnavailable} onRendered={onRendered} />);
    expect(host.animations[0]!.play).toHaveBeenCalledTimes(1);
    expect(host.render).toHaveBeenLastCalledWith(tick, true);
    tick({ timestamp: 1000 });
    expect(host.draw.mock.lastCall![0].time).toBe(34);
    tick({ timestamp: 1016 });
    expect(host.draw.mock.lastCall![0].time).toBe(50);
    expect(host.dispose).not.toHaveBeenCalled();
    expect(onRendered).toHaveBeenCalledTimes(1);
  });

  it('finishes rapid taps at their original coordinates as rendering capacity becomes available', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ width: 400, height: 320 }),
    );
    const { unmount } = render(<TopographyField onUnavailable={vi.fn()} onRendered={vi.fn()} />);
    const field = screen.getByRole('button', { name: 'Lichtimpuls im Glas auslösen' });
    const tick = activeFrame();
    const taps = Array.from({ length: 10 }, (_, i) => [20 + i, 80 - i, 0, 1]);
    taps.push(taps[8]!);
    for (const [clientX, clientY] of taps) fireEvent.click(field, { detail: 1, clientX, clientY });
    expect(host.animations).toHaveLength(8);
    tick({ timestamp: 0 });
    expect(Array.from(host.draw.mock.lastCall![0].ripples)).toEqual(taps.slice(0, 8).flat());
    for (const [offset, finished] of [4, 2, 6].entries()) {
      await act(async () => host.animations[finished]!.finish());
      expect(host.animations).toHaveLength(9 + offset);
      tick({ timestamp: 16 * (offset + 1) });
      const lanes = host.draw.mock.lastCall![0].ripples as Float32Array;
      const active = Array.from({ length: 8 }, (_, i) => Array.from(lanes.slice(i * 4, i * 4 + 4)));
      const expected = taps[8 + offset]!;
      const atOrigin = active.filter(([x, y]) => x === expected[0] && y === expected[1]);
      expect(atOrigin).toEqual(taps.slice(8, 9 + offset).filter((tap) => tap === expected));
      expect(active).not.toContainEqual(taps[finished]);
    }
    await act(async () => {
      for (const control of host.animations) control.finish();
    });
    tick({ timestamp: 96 });
    expect(host.draw.mock.lastCall![0].ripples.every((value: number) => value === 0)).toBe(true);
    unmount();
    for (const control of host.animations) expect(control.stop).not.toHaveBeenCalled();
  });

  it('limits delayed waves after a burst of repeated and distinct presses', async () => {
    vi.spyOn(performance, 'now').mockReturnValue(0);
    render(<TopographyField onUnavailable={vi.fn()} onRendered={vi.fn()} />);
    const field = screen.getByRole('button', { name: 'Lichtimpuls im Glas auslösen' });
    for (let index = 0; index < 64; index++) {
      const clientX = index % 2 === 0 ? 25 : 30 + index;
      fireEvent.click(field, { detail: 1, clientX, clientY: 50 });
    }

    expect(host.animations).toHaveLength(8);
    await finishGlassWaves(0, 8);
    expect(host.animations).toHaveLength(16);
    await finishGlassWaves(8, 16);
    expect(host.animations).toHaveLength(24);
    await finishGlassWaves(16, 24);
    expect(host.animations).toHaveLength(24);
    fireEvent.click(field);
    expect(host.animations).toHaveLength(25);
  });

  it('lets fresh waves through after stale taps expire in active playback time', async () => {
    host.rippleCapacity = 4;
    const clock = vi.spyOn(performance, 'now').mockReturnValue(0);
    const onRendered = vi.fn();
    const onUnavailable = vi.fn();
    const { rerender } = render(
      <TopographyField onUnavailable={onUnavailable} onRendered={onRendered} />,
    );
    const field = screen.getByRole('button', { name: 'Lichtimpuls im Glas auslösen' });
    for (let index = 0; index < 20; index++)
      fireEvent.click(field, { detail: 1, clientX: 50, clientY: 50 });

    clock.mockReturnValue(2_600);
    await finishGlassWaves(0, 4);
    expect(host.animations).toHaveLength(8);
    rerender(<TopographyField paused onUnavailable={onUnavailable} onRendered={onRendered} />);
    clock.mockReturnValue(12_600);
    rerender(<TopographyField onUnavailable={onUnavailable} onRendered={onRendered} />);
    clock.mockReturnValue(15_200);
    await finishGlassWaves(4, 8);
    expect(host.animations).toHaveLength(12);
    fireEvent.click(field, { detail: 1, clientX: 75, clientY: 75 });

    clock.mockReturnValue(17_800);
    await finishGlassWaves(8, 12);
    expect(host.animations).toHaveLength(13);
    activeFrame()({ timestamp: 7_800 });
    expect(Array.from(host.draw.mock.lastCall![0].ripples.slice(0, 4))).toEqual([75, 75, 0, 1]);
  });

  it('bounds raster density and retires active and waiting waves with the frame owner', async () => {
    vi.stubGlobal('devicePixelRatio', 4);
    const onRendered = vi.fn();
    const { unmount } = render(<TopographyField onUnavailable={vi.fn()} onRendered={onRendered} />);
    expect(onRendered).toHaveBeenCalledWith(true);
    expect(host.draw.mock.calls[0]![0].dpr).toBe(0.5);
    const field = screen.getByRole('button', { name: 'Lichtimpuls im Glas auslösen' });
    for (let wave = 0; wave < 11; wave++)
      fireEvent.click(field, { detail: 1, clientX: 25, clientY: 25 });
    expect(host.animations).toHaveLength(8);
    unmount();
    for (const animation of host.animations) expect(animation.stop).toHaveBeenCalledTimes(1);
    await finishGlassWaves(0);
    expect(host.animations).toHaveLength(8);
    expect(host.cancel).toHaveBeenCalledWith(host.render.mock.calls[0]![0]);
    expect(host.dispose).toHaveBeenCalledTimes(1);
    expect(onRendered).toHaveBeenLastCalledWith(false);
  });

  it('stops rendering immediately on GPU context loss and requests the static fallback', () => {
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

  it('keeps the poster during compilation and suspends polling until playback resumes', () => {
    host.draw.mockReturnValue('pending');
    const onRendered = vi.fn();
    const onUnavailable = vi.fn();
    const props = { onRendered, onUnavailable };
    const { rerender } = render(<TopographyField {...props} />);
    const tick = activeFrame();
    act(() => tick({ timestamp: 30 }));
    expect(onRendered).not.toHaveBeenCalled();
    rerender(<TopographyField {...props} paused />);
    expect(host.cancel).toHaveBeenCalledWith(tick);
    const polls = host.draw.mock.calls.length;
    host.draw.mockReturnValue(true);
    act(() => tick({ timestamp: 60 }));
    expect(host.draw).toHaveBeenCalledTimes(polls);
    rerender(<TopographyField {...props} />);
    act(() => tick({ timestamp: 500 }));
    expect(onRendered.mock.calls).toEqual([[true]]);
    expect(host.draw.mock.lastCall![0].time).toBe(0);
    expect(onUnavailable).not.toHaveBeenCalled();
  });

  it('retires an unfinished link when the decorative scene unmounts', () => {
    host.draw.mockReturnValue('pending');
    const onRendered = vi.fn();
    const { unmount } = render(<TopographyField onRendered={onRendered} onUnavailable={vi.fn()} />);
    const tick = activeFrame();
    unmount();
    expect(host.dispose).toHaveBeenCalledTimes(1);
    expect(host.cancel).toHaveBeenCalledWith(tick);
    act(() => tick({ timestamp: 16 }));
    expect(host.draw).toHaveBeenCalledTimes(1);
    expect(onRendered).not.toHaveBeenCalledWith(true);
  });

  it('retires GPU work and restores the fallback if a later raster allocation fails', () => {
    const unavailable = vi.fn();
    const onRendered = vi.fn();
    render(<TopographyField onUnavailable={unavailable} onRendered={onRendered} />);
    expect(onRendered).toHaveBeenCalledWith(true);
    const tick = activeFrame();
    tick({ timestamp: 0 });
    host.draw.mockReturnValue(false);
    act(() => tick({ timestamp: 34 }));
    expect(host.dispose).toHaveBeenCalledTimes(1);
    expect(host.cancel).toHaveBeenCalledWith(tick);
    expect(onRendered).toHaveBeenLastCalledWith(false);
    expect(unavailable).toHaveBeenCalledTimes(1);
  });

  it('keeps the paused glass frame when the surrounding theme changes', async () => {
    render(<TopographyField paused onUnavailable={vi.fn()} onRendered={vi.fn()} />);
    expect(host.draw).toHaveBeenCalledTimes(1);
    try {
      await act(async () => {
        document.documentElement.classList.add('dark');
      });
      expect(host.draw).toHaveBeenCalledTimes(1);
      expect(host.render).not.toHaveBeenCalled();
    } finally {
      document.documentElement.classList.remove('dark');
    }
  });
});
