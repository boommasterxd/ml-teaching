/**
 * useConsentFlow.test.ts
 *
 * Unit tests for the useConsentFlow hook. Covers initial state, consent
 * grant sequence, derived flag logic, and the enforced order requirement
 * (camera consent requires prior general consent).
 */

import { afterEach, describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConsentFlow } from '@/hooks/useConsentFlow';
import {
  clearRememberedTrainingConsent,
  readRememberedTrainingConsent,
} from '@/lib/training-consent-storage';

afterEach(clearRememberedTrainingConsent);

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

  it('requires general consent before offering the camera choice', () => {
    const { result } = renderHook(() => useConsentFlow());
    expect(result.current).toMatchObject({
      hasConsented: false,
      cameraConsent: false,
      showConsentModal: true,
      showCameraModal: false,
      isFullyConsented: false,
    });
  });

  it('offers the camera choice after general consent', () => {
    const { result } = renderHook(() => useConsentFlow());
    act(() => result.current.grantConsent());
    expect(result.current).toMatchObject({
      hasConsented: true,
      showConsentModal: false,
      showCameraModal: true,
      isFullyConsented: false,
    });
  });

  it('completes the consent flow after the camera choice is granted', () => {
    const { result } = renderHook(() => useConsentFlow());
    act(() => result.current.grantConsent());
    act(() => result.current.grantCameraConsent());
    expect(result.current).toMatchObject({
      cameraConsent: true,
      isFullyConsented: true,
      showCameraModal: false,
    });
  });

  it('ignores a camera-ready callback that finishes after withdrawal', () => {
    const { result } = renderHook(() => useConsentFlow());
    act(() => result.current.grantConsent(true));
    act(() => result.current.grantCameraConsent());
    const lateCameraReady = result.current.saveCameraPermission;
    act(() => {
      result.current.revokeCameraConsent();
      lateCameraReady();
    });

    expect(result.current.cameraConsent).toBe(false);
    expect(readRememberedTrainingConsent()?.camera).toBe('declined');
  });
});
