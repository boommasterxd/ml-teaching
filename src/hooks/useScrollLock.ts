/**
 * useScrollLock.ts
 *
 * React hook that prevents body scrolling while a modal or overlay is active.
 * Uses a ScrollLockManager to track concurrent consumers so nested modals do
 * not prematurely release the lock when one of them closes.
 */
import { useEffect, useRef } from 'react';

/** Manages a reference count of active scroll-lock consumers. */
export class ScrollLockManager {
  private count = 0;

  acquire() {
    this.count++;
    if (this.count === 1) this.apply(true);
  }

  release() {
    this.count--;
    if (this.count === 0) this.apply(false);
  }

  private apply(lock: boolean) {
    const overflow = lock ? 'hidden' : '';
    document.body.style.overflow = overflow;
    document.documentElement.style.overflow = overflow;
    document.body.style.overscrollBehavior = lock ? 'none' : '';
  }
}

/** Shared singleton used by the hook in production. */
export const scrollLockManager = new ScrollLockManager();

/**
 * Locks body scroll when `lock` is true and releases it when the component
 * unmounts or `lock` switches to false. Multiple concurrent consumers are
 * supported — the lock is only removed once every consumer has released it.
 *
 * @param lock    - Whether this consumer currently wants the scroll to be locked.
 * @param manager - ScrollLockManager instance (injectable for testing).
 */
export default function useScrollLock(lock: boolean, manager = scrollLockManager) {
  const managerRef = useRef(manager);
  managerRef.current = manager;

  useEffect(() => {
    if (!lock) return;
    managerRef.current.acquire();
    return () => managerRef.current.release();
  }, [lock]);
}
