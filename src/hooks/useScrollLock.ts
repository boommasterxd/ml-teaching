/**
 * Hook that prevents body scrolling while a modal or overlay is visible.
 * Uses a global reference counter so nested modals do not unlock prematurely.
 */
import { useEffect } from 'react';

let lockCount = 0;

/** Locks body scroll when `lock` is true; unlocks when all consumers release. */
export default function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (lock) {
      lockCount++;
      
      // If this is the first lock, apply the style
      if (lockCount === 1) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none';
      }
      
      return () => {
        lockCount--;
        // Only restore scroll if no other components are locking it
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
