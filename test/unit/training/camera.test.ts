import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useCameraStream } from '@/hooks/useCameraStream';

afterEach(() => vi.unstubAllGlobals());

function camera() {
  const track = Object.assign(new EventTarget(), { stop: vi.fn(), readyState: 'live' });
  const stream = { getTracks: () => [track] } as unknown as MediaStream;
  return { stream, track };
}

it('stops a late permission result and releases the camera obtained on reentry', async () => {
  const pending = Promise.withResolvers<MediaStream>();
  const late = camera();
  const current = camera();
  const getUserMedia = vi
    .fn()
    .mockReturnValueOnce(pending.promise)
    .mockResolvedValueOnce(current.stream);
  const onReady = vi.fn();
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  const onError = vi.fn();
  const { result, rerender } = renderHook(
    ({ consent }) => useCameraStream(consent, false, onError, true, onReady),
    { initialProps: { consent: false } },
  );

  expect(getUserMedia).not.toHaveBeenCalled();
  rerender({ consent: true });
  rerender({ consent: false });
  await act(async () => pending.resolve(late.stream));
  expect(late.track.stop).toHaveBeenCalledOnce();
  expect(result.current.stream).toBeNull();
  expect(onReady).not.toHaveBeenCalled();

  await act(async () => rerender({ consent: true }));
  expect(result.current.stream).toBe(current.stream);
  expect(onReady).toHaveBeenCalledOnce();

  rerender({ consent: false });
  expect(current.track.stop).toHaveBeenCalledOnce();
  expect(result.current.stream).toBeNull();
  expect(onError).not.toHaveBeenCalled();
});
