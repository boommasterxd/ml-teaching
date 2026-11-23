import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearRememberedTrainingConsent,
  readRememberedTrainingConsent,
  TRAINING_CONSENT_DURATION,
  writeRememberedTrainingConsent,
} from '@/lib/training-consent-storage';

const start = Date.UTC(2026, 10, 22, 10);
const deadline = start + TRAINING_CONSENT_DURATION;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(start);
});

afterEach(() => {
  clearRememberedTrainingConsent();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('remembering image-training consent within the document', () => {
  it('remembers the choice and camera updates without extending the expiry', () => {
    writeRememberedTrainingConsent(deadline, 'pending');
    expect(readRememberedTrainingConsent()).toEqual({ expiresAt: deadline, camera: 'pending' });

    vi.setSystemTime(start + 60_000);
    writeRememberedTrainingConsent(Date.now() + TRAINING_CONSENT_DURATION, 'allowed');
    expect(readRememberedTrainingConsent()).toEqual({ expiresAt: deadline, camera: 'allowed' });

    vi.setSystemTime(deadline);
    writeRememberedTrainingConsent(deadline, 'declined', true);
    expect(readRememberedTrainingConsent()).toBeNull();
  });

  it('cannot recreate a withdrawn choice with a camera update', () => {
    writeRememberedTrainingConsent(deadline, 'pending');
    clearRememberedTrainingConsent();
    writeRememberedTrainingConsent(deadline, 'allowed', true);
    expect(readRememberedTrainingConsent()).toBeNull();
  });

  it('can remember and revoke consent when browser storage is blocked', () => {
    for (const storage of ['sessionStorage', 'localStorage'] as const) {
      vi.spyOn(window, storage, 'get').mockImplementation(() => {
        throw new DOMException('Blocked', 'SecurityError');
      });
    }
    writeRememberedTrainingConsent(deadline, 'allowed');
    expect(readRememberedTrainingConsent()?.camera).toBe('allowed');
    writeRememberedTrainingConsent(deadline, 'declined', true);
    expect(readRememberedTrainingConsent()?.camera).toBe('declined');
    clearRememberedTrainingConsent();
    expect(readRememberedTrainingConsent()).toBeNull();
  });
});
