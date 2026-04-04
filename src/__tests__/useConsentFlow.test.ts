/**
 * useConsentFlow.test.ts
 *
 * Unit tests for the useConsentFlow hook. Covers initial state, consent
 * grant sequence, derived flag logic, and the enforced order requirement
 * (camera consent requires prior general consent).
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConsentFlow } from '../hooks/useConsentFlow';

describe('useConsentFlow', () => {
  describe('Initialer Zustand', () => {
    it('hasConsented startet als false', () => {
      const { result } = renderHook(() => useConsentFlow());
      expect(result.current.hasConsented).toBe(false);
    });

    it('cameraConsent startet als false', () => {
      const { result } = renderHook(() => useConsentFlow());
      expect(result.current.cameraConsent).toBe(false);
    });

    it('showConsentModal ist initial true', () => {
      const { result } = renderHook(() => useConsentFlow());
      expect(result.current.showConsentModal).toBe(true);
    });

    it('showCameraModal ist initial false', () => {
      const { result } = renderHook(() => useConsentFlow());
      expect(result.current.showCameraModal).toBe(false);
    });

    it('isFullyConsented ist initial false', () => {
      const { result } = renderHook(() => useConsentFlow());
      expect(result.current.isFullyConsented).toBe(false);
    });
  });

  describe('grantConsent', () => {
    it('setzt hasConsented auf true', () => {
      const { result } = renderHook(() => useConsentFlow());
      act(() => { result.current.grantConsent(); });
      expect(result.current.hasConsented).toBe(true);
    });

    it('blendet showConsentModal aus', () => {
      const { result } = renderHook(() => useConsentFlow());
      act(() => { result.current.grantConsent(); });
      expect(result.current.showConsentModal).toBe(false);
    });

    it('zeigt showCameraModal nachdem allgemeiner Consent erteilt wurde', () => {
      const { result } = renderHook(() => useConsentFlow());
      act(() => { result.current.grantConsent(); });
      expect(result.current.showCameraModal).toBe(true);
    });

    it('isFullyConsented bleibt false ohne Kamera-Consent', () => {
      const { result } = renderHook(() => useConsentFlow());
      act(() => { result.current.grantConsent(); });
      expect(result.current.isFullyConsented).toBe(false);
    });
  });

  describe('grantCameraConsent', () => {
    it('setzt cameraConsent auf true', () => {
      const { result } = renderHook(() => useConsentFlow());
      act(() => { result.current.grantConsent(); });
      act(() => { result.current.grantCameraConsent(); });
      expect(result.current.cameraConsent).toBe(true);
    });

    it('setzt isFullyConsented auf true nach vollständigem Consent-Flow', () => {
      const { result } = renderHook(() => useConsentFlow());
      act(() => { result.current.grantConsent(); });
      act(() => { result.current.grantCameraConsent(); });
      expect(result.current.isFullyConsented).toBe(true);
    });

    it('blendet showCameraModal nach Kamera-Consent aus', () => {
      const { result } = renderHook(() => useConsentFlow());
      act(() => { result.current.grantConsent(); });
      act(() => { result.current.grantCameraConsent(); });
      expect(result.current.showCameraModal).toBe(false);
    });
  });

  describe('Reihenfolge-Erzwingung', () => {
    it('showCameraModal bleibt false wenn nur Kamera-Consent ohne allgemeinen Consent erteilt wird', () => {
      const { result } = renderHook(() => useConsentFlow());
      act(() => { result.current.grantCameraConsent(); });
      expect(result.current.showCameraModal).toBe(false);
    });

    it('isFullyConsented bleibt false wenn nur Kamera-Consent ohne allgemeinen Consent erteilt wird', () => {
      const { result } = renderHook(() => useConsentFlow());
      act(() => { result.current.grantCameraConsent(); });
      expect(result.current.isFullyConsented).toBe(false);
    });
  });
});
