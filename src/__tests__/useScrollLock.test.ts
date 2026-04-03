import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useScrollLock, { ScrollLockManager } from '../hooks/useScrollLock';

function freshManager() {
  return new ScrollLockManager();
}

describe('ScrollLockManager', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.style.overscrollBehavior = '';
  });

  it('setzt overflow:hidden beim ersten acquire', () => {
    const manager = freshManager();
    manager.acquire();
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.body.style.overscrollBehavior).toBe('none');
  });

  it('setzt Styles zurück wenn alle Consumer released haben', () => {
    const manager = freshManager();
    manager.acquire();
    manager.release();
    expect(document.body.style.overflow).toBe('');
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.overscrollBehavior).toBe('');
  });

  it('behält Lock aktiv solange noch Consumer aktiv sind', () => {
    const manager = freshManager();
    manager.acquire();
    manager.acquire();
    manager.release();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('released Lock erst wenn letzter Consumer released', () => {
    const manager = freshManager();
    manager.acquire();
    manager.acquire();
    manager.release();
    manager.release();
    expect(document.body.style.overflow).toBe('');
  });
});

describe('useScrollLock', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.style.overscrollBehavior = '';
  });

  it('sperrt Scroll wenn lock=true', () => {
    const manager = freshManager();
    renderHook(() => useScrollLock(true, manager));
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('sperrt Scroll nicht wenn lock=false', () => {
    const manager = freshManager();
    renderHook(() => useScrollLock(false, manager));
    expect(document.body.style.overflow).toBe('');
  });

  it('gibt Lock beim Unmount frei', () => {
    const manager = freshManager();
    const { unmount } = renderHook(() => useScrollLock(true, manager));
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('gibt Lock frei wenn lock von true auf false wechselt', () => {
    const manager = freshManager();
    const { rerender } = renderHook(({ lock }) => useScrollLock(lock, manager), {
      initialProps: { lock: true },
    });
    expect(document.body.style.overflow).toBe('hidden');
    rerender({ lock: false });
    expect(document.body.style.overflow).toBe('');
  });

  it('Instanzen teilen keinen Zustand (Isolationstest)', () => {
    const managerA = freshManager();
    const managerB = freshManager();
    renderHook(() => useScrollLock(true, managerA));
    expect(document.body.style.overflow).toBe('hidden');
    // managerB hat nichts acquired — Lock käme nur von A
    renderHook(() => useScrollLock(false, managerB));
    expect(document.body.style.overflow).toBe('hidden'); // A hält noch
  });
});
