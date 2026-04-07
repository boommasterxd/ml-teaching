/**
 * useScrollLock.test.ts
 *
 * Unit tests for the `ScrollLockManager` class and the `useScrollLock` hook.
 * Covers reference-counted locking behaviour, style cleanup on release,
 * and correct integration with the React lifecycle (mount, unmount, re-render).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useScrollLock, { ScrollLockManager } from '../hooks/useScrollLock';

/**
 * Creates a new, isolated `ScrollLockManager` instance for each test
 * to prevent shared state between test cases.
 */
function freshManager() {
  return new ScrollLockManager();
}

describe('ScrollLockManager', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.style.overscrollBehavior = '';
    document.body.style.paddingRight = '';
  });

  it('sets overflow:hidden on the first acquire', () => {
    const manager = freshManager();
    manager.acquire();
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.body.style.overscrollBehavior).toBe('none');
  });

  it('resets styles when all consumers have released', () => {
    const manager = freshManager();
    manager.acquire();
    manager.release();
    expect(document.body.style.overflow).toBe('');
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.overscrollBehavior).toBe('');
  });

  it('keeps the lock active while at least one consumer is still active', () => {
    const manager = freshManager();
    manager.acquire();
    manager.acquire();
    manager.release();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('releases the lock only when the last consumer releases', () => {
    const manager = freshManager();
    manager.acquire();
    manager.acquire();
    manager.release();
    manager.release();
    expect(document.body.style.overflow).toBe('');
  });

  it('sets paddingRight to compensate for scrollbar width', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    Object.defineProperty(document.documentElement, 'clientWidth', { value: 1009, writable: true, configurable: true });
    const manager = freshManager();
    manager.acquire();
    expect(document.body.style.paddingRight).toBe('15px');
  });

  it('resets paddingRight on release', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    Object.defineProperty(document.documentElement, 'clientWidth', { value: 1009, writable: true, configurable: true });
    const manager = freshManager();
    manager.acquire();
    manager.release();
    expect(document.body.style.paddingRight).toBe('');
  });

  it('does not set paddingRight when scrollbar is not visible', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    Object.defineProperty(document.documentElement, 'clientWidth', { value: 1024, writable: true, configurable: true });
    const manager = freshManager();
    manager.acquire();
    expect(document.body.style.paddingRight).toBe('');
  });
});

describe('useScrollLock', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.style.overscrollBehavior = '';
    document.body.style.paddingRight = '';
  });

  it('locks scroll when lock=true', () => {
    const manager = freshManager();
    renderHook(() => useScrollLock(true, manager));
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('does not lock scroll when lock=false', () => {
    const manager = freshManager();
    renderHook(() => useScrollLock(false, manager));
    expect(document.body.style.overflow).toBe('');
  });

  it('releases the lock on unmount', () => {
    const manager = freshManager();
    const { unmount } = renderHook(() => useScrollLock(true, manager));
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('releases the lock when lock transitions from true to false', () => {
    const manager = freshManager();
    const { rerender } = renderHook(({ lock }) => useScrollLock(lock, manager), {
      initialProps: { lock: true },
    });
    expect(document.body.style.overflow).toBe('hidden');
    rerender({ lock: false });
    expect(document.body.style.overflow).toBe('');
  });

  it('instances do not share state (isolation test)', () => {
    const managerA = freshManager();
    const managerB = freshManager();
    renderHook(() => useScrollLock(true, managerA));
    expect(document.body.style.overflow).toBe('hidden');
    // managerB has not acquired anything — the lock is held by managerA only
    renderHook(() => useScrollLock(false, managerB));
    expect(document.body.style.overflow).toBe('hidden'); // managerA still holds the lock
  });
});
