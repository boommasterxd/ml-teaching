/**
 * useCameraStream.test.ts
 *
 * Unit tests for the useCameraStream hook. Covers stream setup on consent,
 * guard conditions without consent, error reporting on getUserMedia failure,
 * camera toggle and stream cleanup
 * on unmount.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCameraStream } from '@/hooks/useCameraStream';

// ─── Mock Factories ──────────────────────────────────────────────────────────

/**
 * Creates a mock MediaStreamTrack with a spy on `stop`.
 */
function makeMockTrack() {
  return Object.assign(new EventTarget(), { stop: vi.fn(), readyState: 'live' });
}

/**
 * Creates a mock MediaStream with configurable track stubs.
 *
 * @param tracks - Array of mock tracks to return from `getTracks()`.
 */
function makeMockStream(tracks = [makeMockTrack()]) {
  return {
    getTracks: vi.fn(() => tracks),
  } as unknown as MediaStream;
}

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useCameraStream', () => {
  describe('Initialer Zustand', () => {
    it('facingMode startet als user', () => {
      const { result } = renderHook(() => useCameraStream(false, false, vi.fn()));
      expect(result.current.facingMode).toBe('user');
    });

    it('stream startet als null', () => {
      const { result } = renderHook(() => useCameraStream(false, false, vi.fn()));
      expect(result.current.stream).toBeNull();
    });
  });

  describe('Stream-Setup bei Consent', () => {
    it('ruft getUserMedia auf wenn cameraConsent true ist', async () => {
      const mockStream = makeMockStream();
      const getUserMedia = vi.fn().mockResolvedValue(mockStream);
      vi.stubGlobal('navigator', {
        mediaDevices: { getUserMedia },
      });

      await act(async () => {
        renderHook(() => useCameraStream(true, false, vi.fn()));
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      });

      expect(getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({ video: expect.any(Object), audio: false }),
      );
    });

    it('setzt stream nach erfolgreichem getUserMedia', async () => {
      const mockStream = makeMockStream();
      vi.stubGlobal('navigator', {
        mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      });

      const { result } = renderHook(() => useCameraStream(true, false, vi.fn()));

      await act(async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.stream).toBe(mockStream);
    });
  });

  describe('Kein Setup ohne Consent', () => {
    it('waits for model readiness and releases the camera while models are loading', async () => {
      const track = makeMockTrack();
      const getUserMedia = vi.fn().mockResolvedValue(makeMockStream([track]));
      vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
      const { result, rerender } = renderHook(
        ({ loading }) => useCameraStream(true, loading, vi.fn()),
        { initialProps: { loading: true } },
      );
      expect(getUserMedia).not.toHaveBeenCalled();
      rerender({ loading: false });
      await act(async () => {
        await Promise.resolve();
      });
      expect(getUserMedia).toHaveBeenCalledOnce();
      expect(result.current.stream).not.toBeNull();
      rerender({ loading: true });
      expect(result.current.stream).toBeNull();
      expect(track.stop).toHaveBeenCalledOnce();
    });
    it('does not request camera access without consent, including on retry', async () => {
      const getUserMedia = vi.fn().mockResolvedValue(makeMockStream());
      vi.stubGlobal('navigator', {
        mediaDevices: { getUserMedia },
      });

      const { result } = renderHook(() => useCameraStream(false, false, vi.fn()));
      await act(async () => result.current.retryCamera());

      expect(getUserMedia).not.toHaveBeenCalled();
    });
  });

  describe('Fehlerbehandlung', () => {
    it('reports an access failure and allows a single explicit retry', async () => {
      const replacement = makeMockStream();
      const getUserMedia = vi
        .fn()
        .mockRejectedValueOnce(new Error('Permission denied'))
        .mockResolvedValueOnce(replacement);
      vi.stubGlobal('navigator', {
        mediaDevices: { getUserMedia },
      });
      const onError = vi.fn();
      const { result } = renderHook(() => useCameraStream(true, false, onError));
      await act(async () => {});
      expect(onError).toHaveBeenCalledWith('camera', expect.any(String));
      expect(result.current.hasFailed).toBe(true);
      await act(async () => {
        result.current.retryCamera();
        result.current.retryCamera();
      });
      expect(getUserMedia).toHaveBeenCalledTimes(2);
      expect(result.current.stream).toBe(replacement);
      expect(result.current.hasFailed).toBe(false);
    });

    it('retires an interrupted stream, waits for retry and ignores later events from the old track', async () => {
      const lostTrack = makeMockTrack();
      const original = makeMockStream([lostTrack]);
      const replacement = makeMockStream();
      const getUserMedia = vi
        .fn()
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce(replacement);
      vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
      const onError = vi.fn();
      const { result } = renderHook(() => useCameraStream(true, false, onError));
      await act(async () => {});
      expect(result.current.streamRef.current).toBe(original);

      act(() => {
        lostTrack.readyState = 'ended';
        lostTrack.dispatchEvent(new Event('ended'));
      });
      expect(result.current.stream).toBeNull();
      expect(result.current.streamRef.current).toBeNull();
      expect(result.current.hasFailed).toBe(true);
      expect(result.current.isPending).toBe(false);
      expect(onError).toHaveBeenCalledWith('camera', expect.stringContaining('unterbrochen'));
      expect(getUserMedia).toHaveBeenCalledOnce();

      await act(async () => result.current.retryCamera());
      expect(result.current.stream).toBe(replacement);
      act(() => lostTrack.dispatchEvent(new Event('ended')));
      expect(result.current.streamRef.current).toBe(replacement);
      expect(onError).toHaveBeenCalledOnce();
      expect(lostTrack.stop).toHaveBeenCalledOnce();
    });
  });

  describe('toggleCamera', () => {
    it('waits for a fresh stream when retrying the previous camera after a failed switch', async () => {
      const previousTrack = makeMockTrack();
      const previousStream = makeMockStream([previousTrack]);
      const replacementStream = makeMockStream();
      let resolveReplacement!: (stream: MediaStream) => void;
      const getUserMedia = vi
        .fn()
        .mockResolvedValueOnce(previousStream)
        .mockRejectedValueOnce(new Error('Camera unavailable'))
        .mockImplementationOnce(
          () =>
            new Promise<MediaStream>((resolve) => {
              resolveReplacement = resolve;
            }),
        );
      vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
      const onError = vi.fn();
      const { result } = renderHook(() => useCameraStream(true, false, onError));
      await act(async () => {});
      expect(result.current.stream).toBe(previousStream);

      act(() => result.current.toggleCamera());
      expect(result.current.stream).toBeNull();
      expect(result.current.isSwitching).toBe(true);
      expect(previousTrack.stop).toHaveBeenCalledOnce();
      await act(async () => {});
      expect(result.current.isPending).toBe(false);
      expect(onError).toHaveBeenCalledOnce();

      act(() => result.current.toggleCamera());
      expect(result.current.stream).toBeNull();
      expect(result.current.isSwitching).toBe(false);
      expect(result.current.isPending).toBe(true);
      await act(async () => resolveReplacement(replacementStream));
      expect(result.current.stream).toBe(replacementStream);
      expect(result.current.isPending).toBe(false);
    });

    it('wechselt facingMode von user zu environment', () => {
      const { result } = renderHook(() => useCameraStream(false, false, vi.fn()));

      act(() => {
        result.current.toggleCamera();
      });

      expect(result.current.facingMode).toBe('environment');
    });

    it('wechselt facingMode von environment zurück zu user', () => {
      const { result } = renderHook(() => useCameraStream(false, false, vi.fn()));

      act(() => {
        result.current.toggleCamera();
      });
      act(() => {
        result.current.toggleCamera();
      });

      expect(result.current.facingMode).toBe('user');
    });
  });

  describe('Cleanup bei Unmount', () => {
    it('stops a late stream after demand ends and waits until the camera is needed again', async () => {
      const track = makeMockTrack();
      const pending = Promise.withResolvers<MediaStream>();
      const replacement = makeMockStream();
      const getUserMedia = vi
        .fn()
        .mockReturnValueOnce(pending.promise)
        .mockResolvedValueOnce(replacement);
      const onReady = vi.fn();
      vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
      const { result, rerender } = renderHook(
        ({ needed }) => useCameraStream(true, false, vi.fn(), needed, onReady),
        { initialProps: { needed: true } },
      );
      rerender({ needed: false });
      await act(async () => pending.resolve(makeMockStream([track])));
      expect(track.stop).toHaveBeenCalledOnce();
      expect(result.current.stream).toBeNull();
      expect(getUserMedia).toHaveBeenCalledOnce();
      expect(onReady).not.toHaveBeenCalled();

      await act(async () => rerender({ needed: true }));
      expect(result.current.stream).toBe(replacement);
      expect(getUserMedia).toHaveBeenCalledTimes(2);
      expect(onReady).toHaveBeenCalledOnce();
    });
    it('stops tracks when permission resolves after unmount', async () => {
      let allow!: (stream: MediaStream) => void;
      const pending = new Promise<MediaStream>((resolve) => {
        allow = resolve;
      });
      vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn(() => pending) } });
      const track = makeMockTrack();
      const { unmount } = renderHook(() => useCameraStream(true, false, vi.fn()));
      unmount();
      await act(async () => {
        allow(makeMockStream([track]));
      });
      expect(track.stop).toHaveBeenCalledOnce();
    });

    it('keeps the new camera when an obsolete permission request resolves last', async () => {
      let first!: (stream: MediaStream) => void;
      let second!: (stream: MediaStream) => void;
      const getUserMedia = vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              first = resolve;
            }),
        )
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              second = resolve;
            }),
        );
      vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
      const onError = vi.fn();
      const { result } = renderHook(() => useCameraStream(true, false, onError));
      act(() => result.current.toggleCamera());
      const current = makeMockStream();
      await act(async () => {
        second(current);
      });
      const oldTrack = makeMockTrack();
      await act(async () => {
        first(makeMockStream([oldTrack]));
      });
      expect(result.current.stream).toBe(current);
      expect(oldTrack.stop).toHaveBeenCalledOnce();
      expect(getUserMedia).toHaveBeenCalledTimes(2);
    });
    it('stoppt alle Tracks beim Unmount', async () => {
      const track = makeMockTrack();
      const mockStream = makeMockStream([track]);
      vi.stubGlobal('navigator', {
        mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      });

      const { unmount } = renderHook(() => useCameraStream(true, false, vi.fn()));

      await act(async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      });

      unmount();

      expect(track.stop).toHaveBeenCalled();
    });
  });
});
