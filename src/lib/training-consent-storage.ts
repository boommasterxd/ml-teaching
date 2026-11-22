import { learningPaths } from './learning-paths';

const storageKey = 'ml-teaching-training-consent';
const version = 1;
const cameraChoices = ['allowed', 'declined', 'pending'] as const;
const recordPattern = new RegExp(`^${version}:([1-9][0-9]{0,14}):(${cameraChoices.join('|')})$`);
let revokedForDocument = false;

export const TRAINING_CONSENT_DURATION = 30 * 60 * 1000;

export interface RememberedTrainingConsent {
  expiresAt: number;
  camera: (typeof cameraChoices)[number];
}

function parseConsent(value: string | null, now: number): RememberedTrainingConsent | null {
  const match = value && recordPattern.exec(value);
  if (!match) return null;
  const expiresAt = Number(match[1]);
  if (!(expiresAt > now && expiresAt <= now + TRAINING_CONSENT_DURATION)) return null;
  return { expiresAt, camera: match[2] as RememberedTrainingConsent['camera'] };
}

export function readRememberedTrainingConsent(now = Date.now()): RememberedTrainingConsent | null {
  if (revokedForDocument) return null;
  try {
    const storage = window.sessionStorage;
    const value = storage.getItem(storageKey);
    const consent = parseConsent(value, now);
    if (value !== null && !consent) storage.removeItem(storageKey);
    return consent;
  } catch {
    return null;
  }
}

export function writeRememberedTrainingConsent(
  expiresAt: number,
  camera: RememberedTrainingConsent['camera'],
  updateOnly = false,
): boolean {
  const now = Date.now();
  if (!parseConsent(`${version}:${expiresAt}:${camera}`, now)) return false;
  try {
    const storage = window.sessionStorage;
    const existing = revokedForDocument ? null : parseConsent(storage.getItem(storageKey), now);
    if (updateOnly && existing?.expiresAt !== expiresAt) return false;
    const deadline = existing ? Math.min(expiresAt, existing.expiresAt) : expiresAt;
    storage.setItem(storageKey, `${version}:${deadline}:${camera}`);
    revokedForDocument = false;
    return true;
  } catch {
    return false;
  }
}

export function clearRememberedTrainingConsent(): boolean {
  try {
    const storage = window.sessionStorage;
    try {
      storage.removeItem(storageKey);
    } catch {
      storage.setItem(storageKey, '');
    }
    revokedForDocument = false;
    return true;
  } catch {
    revokedForDocument = true;
    return false;
  }
}

/** Build-known script for the static training page's first paint. Keep validation in sync. */
export const TRAINING_CONSENT_BOOTSTRAP_SCRIPT = `(()=>{
  if (window.location.pathname !== ${JSON.stringify(learningPaths.imagePractice)}) return;
  const data = document.documentElement.dataset;
  delete data.trainingConsent;
  try {
    const value = window.sessionStorage.getItem(${JSON.stringify(storageKey)});
    const match = value && new RegExp(${JSON.stringify(recordPattern.source)}).exec(value);
    const expiresAt = Number(match && match[1]);
    const now = Date.now();
    if (expiresAt > now && expiresAt <= now + ${TRAINING_CONSENT_DURATION}) {
      data.trainingConsent = "remembered";
    }
  } catch {}
})()`;
