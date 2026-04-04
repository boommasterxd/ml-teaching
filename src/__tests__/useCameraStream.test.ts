/**
 * useCameraStream.test.ts
 *
 * Unit tests for the useCameraStream hook. Covers stream setup on consent,
 * guard conditions without consent, error reporting on getUserMedia failure,
 * camera toggle, srcObject assignment to the video ref, and stream cleanup
 * on unmount.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCameraStream } from '../hooks/useCameraStream';
import type React from 'react';

// ─── Mock Factories ──────────────────────────────────────────────────────────

/**
 * Creates a mock MediaStreamTrack with a spy on `stop`.
 */
function makeMockTrack() {
  return { stop: vi.fn() };
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

/**
 * Creates a mock React ref pointing to a stub HTMLVideoElement.
 */
function makeVideoRef(): React.RefObject<HTMLVideoElement | null> {
  const video = { srcObject: null } as unknown as HTMLVideoElement;
  return { current: video };
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
      const { result } = renderHook(() =>
        useCameraStream(false, false, { current: null }, vi.fn())
      );
      expect(result.current.facingMode).toBe('user');
    });

    it('stream startet als null', () => {
      const { result } = renderHook(() =>
        useCameraStream(false, false, { current: null }, vi.fn())
      );
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
        renderHook(() =>
          useCameraStream(true, false, { current: null }, vi.fn())
        );
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      });

      expect(getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({ video: expect.any(Object), audio: false })
      );
    });

    it('setzt stream nach erfolgreichem getUserMedia', async () => {
      const mockStream = makeMockStream();
      vi.stubGlobal('navigator', {
        mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      });

      const { result } = renderHook(() =>
        useCameraStream(true, false, { current: null }, vi.fn())
      );

      await act(async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.stream).toBe(mockStream);
    });

    it('weist den Stream dem srcObject der videoRef zu', async () => {
      const mockStream = makeMockStream();
      vi.stubGlobal('navigator', {
        mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      });
      const videoRef = makeVideoRef();

      renderHook(() => useCameraStream(true, false, videoRef, vi.fn()));

      await act(async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      });

      expect(videoRef.current?.srcObject).toBe(mockStream);
    });
  });

  describe('Kein Setup ohne Consent', () => {
    it('ruft getUserMedia nicht auf wenn cameraConsent false ist', async () => {
      const getUserMedia = vi.fn().mockResolvedValue(makeMockStream());
      vi.stubGlobal('navigator', {
        mediaDevices: { getUserMedia },
      });

      await act(async () => {
        renderHook(() =>
          useCameraStream(false, false, { current: null }, vi.fn())
        );
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      });

      expect(getUserMedia).not.toHaveBeenCalled();
    });
  });

  describe('Fehlerbehandlung', () => {
    it('ruft onError auf wenn getUserMedia fehlschlägt', async () => {
      vi.stubGlobal('navigator', {
        mediaDevices: {
          getUserMedia: vi.fn().mockRejectedValue(new Error('Permission denied')),
        },
      });
      const onError = vi.fn();

      await act(async () => {
        renderHook(() =>
          useCameraStream(true, false, { current: null }, onError)
        );
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      });

      expect(onError).toHaveBeenCalledWith('camera', expect.any(String));
    });
  });

  describe('toggleCamera', () => {
    it('wechselt facingMode von user zu environment', () => {
      const { result } = renderHook(() =>
        useCameraStream(false, false, { current: null }, vi.fn())
      );

      act(() => { result.current.toggleCamera(); });

      expect(result.current.facingMode).toBe('environment');
    });

    it('wechselt facingMode von environment zurück zu user', () => {
      const { result } = renderHook(() =>
        useCameraStream(false, false, { current: null }, vi.fn())
      );

      act(() => { result.current.toggleCamera(); });
      act(() => { result.current.toggleCamera(); });

      expect(result.current.facingMode).toBe('user');
    });
  });

  describe('Cleanup bei Unmount', () => {
    it('stoppt alle Tracks beim Unmount', async () => {
      const track = makeMockTrack();
      const mockStream = makeMockStream([track]);
      vi.stubGlobal('navigator', {
        mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      });

      const { unmount } = renderHook(() =>
        useCameraStream(true, false, { current: null }, vi.fn())
      );

      await act(async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      });

      unmount();

      expect(track.stop).toHaveBeenCalled();
    });
  });
});
