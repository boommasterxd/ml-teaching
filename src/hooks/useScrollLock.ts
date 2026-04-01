/**
 * useScrollLock.ts
 *
 * React hook that prevents body scrolling while a modal or overlay is active.
 * Uses a module-level reference counter so nested modals do not prematurely
 * release the lock when one of them closes.
 */
import { useEffect } from 'react';

/** Tracks how many components are currently requesting a scroll lock. */
let lockCount = 0;

/**
 * Locks body scroll when `lock` is true and releases it when the component
 * unmounts or `lock` switches to false. Multiple concurrent consumers are
 * supported — the lock is only removed once every consumer has released it.
 *
 * @param lock - Whether this consumer currently wants the scroll to be locked.
 */
export default function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (lock) {
      lockCount++;
      
      if (lockCount === 1) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none';
      }
      
      return () => {
        lockCount--;
        if (lockCount === 0) {
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
          document.body.style.overscrollBehavior = '';
        }
      };
    }
    return undefined;
  }, [lock]);
}
