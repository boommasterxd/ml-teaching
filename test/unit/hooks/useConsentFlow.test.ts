/**
 * useConsentFlow.test.ts
 *
 * Unit tests for the useConsentFlow hook. Covers initial state, consent
 * grant sequence, derived flag logic, and the enforced order requirement
 * (camera consent requires prior general consent).
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConsentFlow } from '@/hooks/useConsentFlow';

describe('useConsentFlow', () => {
  it('allows camera-free use and requests permission only after reopening and confirming', () => {
    const { result } = renderHook(() => useConsentFlow());
    act(() => result.current.grantConsent());
    act(() => result.current.declineCameraConsent());
    expect(result.current.cameraDeclined).toBe(true);
    expect(result.current.cameraConsent).toBe(false);
    expect(result.current.showCameraModal).toBe(false);
    expect(result.current.isFullyConsented).toBe(false);
    act(() => result.current.requestCameraConsent());
    expect(result.current.showCameraModal).toBe(true);
    expect(result.current.cameraConsent).toBe(false);
    act(() => result.current.grantCameraConsent());
    expect(result.current.cameraDeclined).toBe(false);
    expect(result.current.cameraConsent).toBe(true);
    expect(result.current.showCameraModal).toBe(false);
    act(() => result.current.revokeCameraConsent());
    expect(result.current.hasConsented).toBe(true);
    expect(result.current.cameraConsent).toBe(false);
    expect(result.current.showCameraModal).toBe(false);
    act(() => result.current.requestCameraConsent());
    expect(result.current.showCameraModal).toBe(true);
    expect(result.current.cameraConsent).toBe(false);
  });
  describe('initial state', () => {
    it('hasConsented starts as false', () => {
      const { result } = renderHook(() => useConsentFlow());
      expect(result.current.hasConsented).toBe(false);
    });

    it('cameraConsent starts as false', () => {
      const { result } = renderHook(() => useConsentFlow());
      expect(result.current.cameraConsent).toBe(false);
    });

    it('showConsentModal is true initially', () => {
      const { result } = renderHook(() => useConsentFlow());
      expect(result.current.showConsentModal).toBe(true);
    });

    it('showCameraModal is false initially', () => {
      const { result } = renderHook(() => useConsentFlow());
      expect(result.current.showCameraModal).toBe(false);
    });

    it('isFullyConsented is false initially', () => {
      const { result } = renderHook(() => useConsentFlow());
      expect(result.current.isFullyConsented).toBe(false);
    });
  });

  describe('grantConsent', () => {
    it('sets hasConsented to true', () => {
      const { result } = renderHook(() => useConsentFlow());
      act(() => {
        result.current.grantConsent();
      });
      expect(result.current.hasConsented).toBe(true);
    });

    it('hides showConsentModal', () => {
      const { result } = renderHook(() => useConsentFlow());
      act(() => {
        result.current.grantConsent();
      });
      expect(result.current.showConsentModal).toBe(false);
    });

    it('shows showCameraModal after general consent is granted', () => {
      const { result } = renderHook(() => useConsentFlow());
      act(() => {
        result.current.grantConsent();
      });
      expect(result.current.showCameraModal).toBe(true);
    });

    it('isFullyConsented remains false without camera consent', () => {
      const { result } = renderHook(() => useConsentFlow());
      act(() => {
        result.current.grantConsent();
      });
      expect(result.current.isFullyConsented).toBe(false);
    });
  });

  describe('grantCameraConsent', () => {
    it('sets cameraConsent to true', () => {
      const { result } = renderHook(() => useConsentFlow());
      act(() => {
        result.current.grantConsent();
      });
      act(() => {
        result.current.grantCameraConsent();
      });
      expect(result.current.cameraConsent).toBe(true);
    });

    it('sets isFullyConsented to true after completing the full consent flow', () => {
      const { result } = renderHook(() => useConsentFlow());
      act(() => {
        result.current.grantConsent();
      });
      act(() => {
        result.current.grantCameraConsent();
      });
      expect(result.current.isFullyConsented).toBe(true);
    });

    it('hides showCameraModal after camera consent is granted', () => {
      const { result } = renderHook(() => useConsentFlow());
      act(() => {
        result.current.grantConsent();
      });
      act(() => {
        result.current.grantCameraConsent();
      });
      expect(result.current.showCameraModal).toBe(false);
    });
  });

  describe('order enforcement', () => {
    it('showCameraModal stays false when only camera consent is granted without prior general consent', () => {
      const { result } = renderHook(() => useConsentFlow());
      act(() => {
        result.current.grantCameraConsent();
      });
      expect(result.current.showCameraModal).toBe(false);
    });

    it('isFullyConsented stays false when only camera consent is granted without prior general consent', () => {
      const { result } = renderHook(() => useConsentFlow());
      act(() => {
        result.current.grantCameraConsent();
      });
      expect(result.current.isFullyConsented).toBe(false);
    });
  });
});
