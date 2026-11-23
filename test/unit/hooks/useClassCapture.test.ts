import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useClassCapture, type CaptureActions } from '@/hooks/useClassCapture';
import { processImageFiles } from '@/lib/image-upload';
import { CAMERA, ML } from '@/constants';
import type { MLClass } from '@/types/ml';
import type React from 'react';

vi.mock('@/lib/image-upload', () => ({ processImageFiles: vi.fn(async () => {}) }));

const makeClass = (count = 0): MLClass => ({
  id: 'class-one',
  name: 'One',
  color: '#ff0000',
  images: Array.from({ length: count }, (_, index) => ({
    id: String(index),
    featureArray: [],
    dataUrl: 'data:image/jpeg;base64,a',
  })),
});
const actions = () => ({
  onAddExample: vi.fn<CaptureActions['onAddExample']>(),
  onCommitCapture: vi.fn<CaptureActions['onCommitCapture']>(),
  onAddImageExample: vi.fn(),
  onError: vi.fn(),
  captureDisabled: false,
  onUploadStart: vi.fn(() => true),
  onUploadEnd: vi.fn(),
});
function makeAttachedVideo() {
  const video = document.createElement('video');
  video.srcObject = {} as MediaStream;
  Object.defineProperty(video, 'readyState', { value: video.HAVE_CURRENT_DATA });
  return video;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});
afterEach(() => vi.useRealTimers());

describe('class image capture', () => {
  it('releases the upload batch exactly once when its class unmounts during processing', async () => {
    let finish!: () => void;
    vi.mocked(processImageFiles).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const callbacks = actions();
    let activeBatches = 0;
    callbacks.onUploadStart.mockImplementation(() => {
      activeBatches++;
      return true;
    });
    callbacks.onUploadEnd.mockImplementation(() => {
      activeBatches--;
    });
    const cls = makeClass();
    const { result, unmount } = renderHook(() => useClassCapture(cls, callbacks));
    const event = {
      target: { files: [new File(['a'], 'a.png')], value: 'selected' },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    act(() => result.current.handleFileUpload(event));
    expect(activeBatches).toBe(1);
    unmount();
    expect(activeBatches).toBe(0);
    await act(async () => {
      finish();
    });
    expect(callbacks.onUploadEnd).toHaveBeenCalledOnce();
  });

  it('does not begin recording or an explicitly rejected file batch during training', () => {
    const callbacks = { ...actions(), captureDisabled: true };
    callbacks.onUploadStart.mockReturnValue(false);
    const cls = makeClass();
    const { result } = renderHook(() => useClassCapture(cls, callbacks));
    result.current.videoRef.current = makeAttachedVideo();
    act(() => result.current.startRecording());
    const event = {
      target: { files: [new File(['a'], 'a.png')], value: 'selected' },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    act(() => result.current.handleFileUpload(event));
    expect(result.current.isRecording).toBe(false);
    expect(processImageFiles).not.toHaveBeenCalled();
    expect(callbacks.onAddExample).not.toHaveBeenCalled();
  });
  it('stops recording and aborts queued uploads when the class is cleared', () => {
    const callbacks = actions();
    const { result, rerender } = renderHook(({ cls }) => useClassCapture(cls, callbacks), {
      initialProps: { cls: makeClass() },
    });
    result.current.videoRef.current = makeAttachedVideo();
    act(() => result.current.startRecording());
    const event = {
      target: { files: [new File(['a'], 'a.png')], value: 'selected' },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    act(() => result.current.handleFileUpload(event));
    const signal = vi.mocked(processImageFiles).mock.calls[0][3];
    rerender({ cls: { ...makeClass(), captureVersion: 1 } });
    expect(signal.aborted).toBe(true);
    expect(result.current.isRecording).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('keeps a single capture loop, uses current callbacks, and releases it on unmount', () => {
    const first = actions();
    const cls = makeClass();
    const { result, rerender, unmount } = renderHook(
      ({ callbacks }) => useClassCapture(cls, callbacks),
      { initialProps: { callbacks: first } },
    );
    const video = makeAttachedVideo();
    result.current.videoRef.current = video;
    act(() => {
      result.current.startRecording();
      result.current.startRecording();
    });
    expect(first.onAddExample).toHaveBeenCalledOnce();
    const second = actions();
    rerender({ callbacks: second });
    act(() => {
      vi.advanceTimersByTime(CAMERA.CAPTURE_INTERVAL_MS);
    });
    expect(second.onAddExample).toHaveBeenCalledWith(cls.id, video);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('discards cancelled held frames including late results and commits a later hold once', () => {
    const callbacks = actions();
    const cls = makeClass(ML.MAX_IMAGES_PER_CLASS - 1);
    const { result } = renderHook(() => useClassCapture(cls, callbacks));
    const video = makeAttachedVideo();
    result.current.videoRef.current = video;
    const [, first, late, kept] = makeClass(4).images;
    act(() => result.current.startRecording(true));
    const cancelled = callbacks.onAddExample.mock.calls[0][2]!;
    cancelled.receive(first);
    act(() => vi.advanceTimersByTime(CAMERA.CAPTURE_INTERVAL_MS));
    expect(vi.getTimerCount()).toBe(0);
    expect(result.current.isRecording).toBe(true);
    act(() => result.current.stopRecording());
    cancelled.receive(late);
    expect(cancelled.signal.aborted).toBe(true);
    expect(callbacks.onCommitCapture).not.toHaveBeenCalled();

    act(() => result.current.startRecording(true));
    const accepted = callbacks.onAddExample.mock.calls[1][2]!;
    accepted.receive(kept);
    act(() => {
      result.current.stopRecording(true);
      result.current.stopRecording();
    });
    accepted.receive(late);
    expect(callbacks.onCommitCapture).toHaveBeenCalledExactlyOnceWith(cls.id, {
      images: [kept],
      stream: video.srcObject,
      version: 0,
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('waits for an offscreen recording to attach the camera before requesting a frame', () => {
    const callbacks = actions();
    const cls = makeClass();
    const { result } = renderHook(() => useClassCapture(cls, callbacks));
    const video = document.createElement('video');
    result.current.videoRef.current = video;
    act(() => result.current.startRecording());
    expect(result.current.isRecording).toBe(true);
    expect(callbacks.onAddExample).not.toHaveBeenCalled();

    video.srcObject = {} as MediaStream;
    act(() => vi.advanceTimersByTime(CAMERA.CAPTURE_INTERVAL_MS));
    expect(callbacks.onAddExample).toHaveBeenCalledWith(cls.id, video);
  });

  it('starts a hold before the preview attaches and waits for the first available frame', () => {
    const callbacks = actions();
    const cls = makeClass();
    const { result } = renderHook(() => useClassCapture(cls, callbacks));
    const video = document.createElement('video');
    const readiness = vi.spyOn(video, 'readyState', 'get').mockReturnValue(video.HAVE_NOTHING);
    result.current.videoRef.current = video;
    act(() => result.current.startRecording(true));
    act(() => vi.advanceTimersByTime(CAMERA.CAPTURE_INTERVAL_MS));
    expect(result.current.isRecording).toBe(true);
    expect(callbacks.onAddExample).not.toHaveBeenCalled();

    const stream = {} as MediaStream;
    video.srcObject = stream;
    act(() => vi.advanceTimersByTime(CAMERA.CAPTURE_INTERVAL_MS));
    expect(callbacks.onAddExample).not.toHaveBeenCalled();
    readiness.mockReturnValue(video.HAVE_CURRENT_DATA);
    act(() => vi.advanceTimersByTime(CAMERA.CAPTURE_INTERVAL_MS));
    const frame = makeClass(1).images[0];
    callbacks.onAddExample.mock.calls[0][2]!.receive(frame);
    act(() => result.current.stopRecording(true));
    expect(callbacks.onCommitCapture).toHaveBeenCalledExactlyOnceWith(cls.id, {
      images: [frame],
      stream,
      version: 0,
    });
  });

  it('discards held frames when the stream changes immediately before release', () => {
    const callbacks = actions();
    const cls = makeClass();
    const { result } = renderHook(() => useClassCapture(cls, callbacks));
    const video = makeAttachedVideo();
    result.current.videoRef.current = video;
    act(() => result.current.startRecording(true));
    const target = callbacks.onAddExample.mock.calls[0][2]!;
    target.receive(makeClass(1).images[0]);

    video.srcObject = {} as MediaStream;
    act(() => result.current.stopRecording(true));
    expect(target.signal.aborted).toBe(true);
    expect(callbacks.onCommitCapture).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops recording at the supported image limit and can be stopped by the control', () => {
    const callbacks = actions();
    const { result, rerender } = renderHook(({ cls }) => useClassCapture(cls, callbacks), {
      initialProps: { cls: makeClass() },
    });
    result.current.videoRef.current = makeAttachedVideo();
    act(() => result.current.startRecording());
    rerender({ cls: makeClass(ML.MAX_IMAGES_PER_CLASS) });
    act(() => {
      vi.advanceTimersByTime(CAMERA.CAPTURE_INTERVAL_MS);
    });
    expect(result.current.isRecording).toBe(false);
    expect(callbacks.onAddExample).toHaveBeenCalledOnce();
    act(() => result.current.startRecording());
    expect(result.current.isRecording).toBe(false);
    rerender({ cls: makeClass() });
    act(() => result.current.startRecording());
    act(() => result.current.stopRecording());
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops a failed camera recording and reports the same error again after a new recording', async () => {
    const callbacks = actions();
    callbacks.onAddExample.mockRejectedValue(new Error('Camera image unavailable'));
    const cls = makeClass();
    const { result } = renderHook(() => useClassCapture(cls, callbacks));
    result.current.videoRef.current = makeAttachedVideo();
    for (let attempt = 1; attempt <= 2; attempt++) {
      await act(async () => result.current.startRecording());
      expect(result.current.isRecording).toBe(false);
      expect(callbacks.onError).toHaveBeenCalledTimes(attempt);
      expect(callbacks.onError).toHaveBeenLastCalledWith(
        expect.stringContaining('Aufnahme erneut'),
      );
      act(() => vi.advanceTimersByTime(5 * CAMERA.CAPTURE_INTERVAL_MS));
      expect(callbacks.onAddExample).toHaveBeenCalledTimes(attempt);
    }
  });

  it('limits queued uploads and aborts decoding on replacement and unmount', () => {
    const cls = makeClass(ML.MAX_IMAGES_PER_CLASS - 1);
    const callbacks = actions();
    const { result, unmount } = renderHook(() => useClassCapture(cls, callbacks));
    const files = [new File(['a'], 'a.png'), new File(['b'], 'b.png')];
    const event = {
      target: { files, value: 'selected' },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    act(() => result.current.handleFileUpload(event));
    expect(processImageFiles).toHaveBeenCalledWith(
      [files[0]],
      expect.any(Function),
      expect.any(Function),
      expect.any(AbortSignal),
    );
    expect(event.target.value).toBe('');
    const firstSignal = vi.mocked(processImageFiles).mock.calls[0][3];
    act(() => result.current.handleFileUpload(event));
    expect(firstSignal.aborted).toBe(true);
    const currentSignal = vi.mocked(processImageFiles).mock.calls[1][3];
    unmount();
    expect(currentSignal.aborted).toBe(true);
  });
});
