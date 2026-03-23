import { useEffect } from 'react';

// Use a global counter to track how many components are requesting a scroll lock.
// This prevents one component from unlocking the scroll while another still needs it.
let lockCount = 0;

/**
 * Custom hook to lock the body scroll when a modal or overlay is open.
 * @param lock - Boolean indicating whether to lock the scroll.
 */
export default function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (lock) {
      lockCount++;
      
      // If this is the first lock, apply the style
      if (lockCount === 1) {
        document.body.style.overflow = 'hidden';
      }
      
      return () => {
        lockCount--;
        // Only restore scroll if no other components are locking it
        if (lockCount === 0) {
          document.body.style.overflow = '';
        }
      };
    }
    return undefined;
  }, [lock]);
}
