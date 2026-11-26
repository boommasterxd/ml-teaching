import { afterEach, expect, it, vi } from 'vitest';
import {
  clearRememberedTrainingConsent,
  readRememberedTrainingConsent,
  TRAINING_CONSENT_DURATION,
  writeRememberedTrainingConsent,
} from '@/lib/training-consent-storage';

afterEach(() => {
  clearRememberedTrainingConsent();
  vi.useRealTimers();
});

it('expires remembered training consent without extending it for a later camera choice', () => {
  const start = Date.UTC(2026, 10, 22, 10);
  const deadline = start + TRAINING_CONSENT_DURATION;
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(start);
  writeRememberedTrainingConsent(deadline, 'pending');

  vi.setSystemTime(start + 60_000);
  writeRememberedTrainingConsent(Date.now() + TRAINING_CONSENT_DURATION, 'allowed');
  expect(readRememberedTrainingConsent()).toEqual({ expiresAt: deadline, camera: 'allowed' });

  vi.setSystemTime(deadline);
  writeRememberedTrainingConsent(Date.now() + TRAINING_CONSENT_DURATION, 'declined', true);
  expect(readRememberedTrainingConsent()).toBeNull();
  expect(window.sessionStorage.length).toBe(0);
  expect(window.localStorage.length).toBe(0);
});
