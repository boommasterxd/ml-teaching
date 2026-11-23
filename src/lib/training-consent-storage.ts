export const TRAINING_CONSENT_DURATION = 30 * 60 * 1000;

export interface RememberedTrainingConsent {
  expiresAt: number;
  camera: 'allowed' | 'declined' | 'pending';
}

// A new document must always ask again, even if the browser clones tab storage.
let remembered: RememberedTrainingConsent | null = null;

export function readRememberedTrainingConsent(now = Date.now()): RememberedTrainingConsent | null {
  if (remembered && remembered.expiresAt <= now) remembered = null;
  return remembered;
}

export function writeRememberedTrainingConsent(
  expiresAt: number,
  camera: RememberedTrainingConsent['camera'],
  updateOnly = false,
): void {
  const now = Date.now();
  if (expiresAt <= now || expiresAt > now + TRAINING_CONSENT_DURATION) return;
  const existing = readRememberedTrainingConsent(now);
  if (updateOnly && existing?.expiresAt !== expiresAt) return;
  const deadline = existing ? Math.min(expiresAt, existing.expiresAt) : expiresAt;
  remembered = { expiresAt: deadline, camera };
}

export function clearRememberedTrainingConsent(): void {
  remembered = null;
}
