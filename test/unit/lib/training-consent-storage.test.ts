import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { learningPaths } from '@/lib/learning-paths';
import {
  clearRememberedTrainingConsent,
  readRememberedTrainingConsent,
  TRAINING_CONSENT_BOOTSTRAP_SCRIPT,
  TRAINING_CONSENT_DURATION,
  writeRememberedTrainingConsent,
} from '@/lib/training-consent-storage';

const storageKey = 'ml-teaching-training-consent';
const start = Date.UTC(2026, 10, 22, 10);
const deadline = start + TRAINING_CONSENT_DURATION;

function boot() {
  new Function('window', 'document', TRAINING_CONSENT_BOOTSTRAP_SCRIPT)(window, document);
  return document.documentElement.dataset.trainingConsent;
}

beforeEach(() => {
  window.history.replaceState(null, '', learningPaths.imagePractice);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(start);
});

afterEach(() => {
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.useRealTimers();
  clearRememberedTrainingConsent();
  delete document.documentElement.dataset.trainingConsent;
});

describe('remembering image-training consent within one tab', () => {
  it('does not check the saved choice before an informational page is painted', () => {
    expect(writeRememberedTrainingConsent(deadline, 'allowed')).toBe(true);
    window.history.replaceState(null, '', learningPaths.images);
    const readStorage = vi.spyOn(Storage.prototype, 'getItem');
    expect(boot()).toBeUndefined();
    expect(readStorage).not.toHaveBeenCalled();
  });

  it('restores the choice before paint and keeps the deadline when the camera choice changes', () => {
    expect(boot()).toBeUndefined();
    expect(writeRememberedTrainingConsent(deadline, 'pending')).toBe(true);
    expect(readRememberedTrainingConsent()).toEqual({ expiresAt: deadline, camera: 'pending' });
    expect(boot()).toBe('remembered');

    vi.setSystemTime(start + 60_000);
    expect(writeRememberedTrainingConsent(Date.now() + TRAINING_CONSENT_DURATION, 'allowed')).toBe(
      true,
    );
    expect(readRememberedTrainingConsent()).toEqual({ expiresAt: deadline, camera: 'allowed' });
    expect(boot()).toBe('remembered');
    vi.setSystemTime(deadline);
    expect(boot()).toBeUndefined();
    expect(readRememberedTrainingConsent()).toBeNull();
    expect(window.sessionStorage.getItem(storageKey)).toBeNull();
    expect(writeRememberedTrainingConsent(deadline, 'declined')).toBe(false);
  });

  it('forgets the choice on withdrawal even if an earlier camera request finishes later', () => {
    expect(writeRememberedTrainingConsent(deadline, 'declined')).toBe(true);
    expect(boot()).toBe('remembered');
    expect(clearRememberedTrainingConsent()).toBe(true);
    expect(writeRememberedTrainingConsent(deadline, 'allowed', true)).toBe(false);
    expect(readRememberedTrainingConsent()).toBeNull();
    expect(boot()).toBeUndefined();
  });

  it('agrees with the bootstrap when an entry is malformed, obsolete or too far ahead', () => {
    const invalidRecords = [
      `2:${deadline}:allowed`,
      `1:${deadline}:unknown`,
      `1:${deadline + 1}:allowed`,
    ];
    for (const value of invalidRecords) {
      window.sessionStorage.setItem(storageKey, value);
      expect(boot()).toBeUndefined();
      expect(readRememberedTrainingConsent()).toBeNull();
      expect(window.sessionStorage.getItem(storageKey)).toBeNull();
    }
  });

  it('honors withdrawal within the open document even when the browser rejects storage removal', () => {
    expect(writeRememberedTrainingConsent(deadline, 'allowed')).toBe(true);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    expect(clearRememberedTrainingConsent()).toBe(false);
    expect(readRememberedTrainingConsent()).toBeNull();
    expect(writeRememberedTrainingConsent(deadline, 'allowed', true)).toBe(false);
    expect(writeRememberedTrainingConsent(deadline, 'pending')).toBe(true);
    expect(readRememberedTrainingConsent()?.camera).toBe('pending');
  });

  it('clears the remembered data before reload if the browser allows overwriting but not removal', () => {
    expect(writeRememberedTrainingConsent(deadline, 'allowed')).toBe(true);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    expect(clearRememberedTrainingConsent()).toBe(true);
    expect(boot()).toBeUndefined();
    expect(readRememberedTrainingConsent()).toBeNull();
  });

  it('fails closed when the tab blocks storage access', () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    expect(readRememberedTrainingConsent()).toBeNull();
    expect(boot()).toBeUndefined();
    expect(writeRememberedTrainingConsent(deadline, 'declined')).toBe(false);
    expect(clearRememberedTrainingConsent()).toBe(false);
  });
});
