import { IMAGE_INPUT_LIMITS } from './image-input-policy';

interface WaitingUpload {
  signal: AbortSignal;
  abort: () => void;
  resolve: (release: () => void) => void;
}

let busy = false;
const waiting: WaitingUpload[] = [];

function createRelease(): () => void {
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const next = waiting.shift();
    if (next) {
      next.signal.removeEventListener('abort', next.abort);
      next.resolve(createRelease());
    } else busy = false;
  };
}

/** Keep one original alive, including while its existing GPU pipeline is awaited. */
export async function acquireImageUpload(signal: AbortSignal): Promise<() => void> {
  if (signal.aborted) throw signal.reason;
  if (!busy) {
    busy = true;
    return createRelease();
  }
  if (waiting.length >= IMAGE_INPUT_LIMITS.MAX_WAITING_JOBS)
    throw new Error('Zu viele Bilder warten auf Verarbeitung. Bitte versuche es gleich erneut.');
  return new Promise((resolve, reject) => {
    const job: WaitingUpload = {
      signal,
      resolve,
      abort: () => {
        waiting.splice(waiting.indexOf(job), 1);
        reject(signal.reason);
      },
    };
    waiting.push(job);
    signal.addEventListener('abort', job.abort, { once: true });
  });
}
