/**
 * useFocusTrap.ts
 *
 * React hook that traps keyboard focus inside a container element (e.g. a modal or dialog).
 * Restores focus to the previously active element when the trap is deactivated.
 */
import { useEffect, useRef } from 'react';

/**
 * Traps Tab/Shift-Tab focus within a ref'd container and intercepts the Escape key.
 *
 * When activated, the hook saves the currently focused element and moves focus into
 * the container. On cleanup, focus is returned to the previously active element.
 *
 * @param isActive - Whether the focus trap is currently active.
 * @param autoFocusFirst - When `true`, moves focus to the first focusable element
 *   inside the container, but only if keyboard navigation mode is detected
 *   (`data-keyboard-nav` attribute on `<html>`). Defaults to `false`.
 * @param onEscape - Optional callback invoked when the user presses Escape.
 * @returns A ref to attach to the container element that should receive the focus trap.
 */
export function useFocusTrap(isActive: boolean, autoFocusFirst: boolean = false, onEscape?: () => void) {
  const rootRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !rootRef.current) return;

    const root = rootRef.current;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    /** Returns all currently focusable elements within the trap container. */
    const getFocusableElements = () => Array.from(
      root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );

    const firstFocusable = getFocusableElements()[0];

    if (autoFocusFirst && firstFocusable && document.documentElement.hasAttribute('data-keyboard-nav')) {
      firstFocusable.focus({ preventScroll: true });
    } else {
      // Focus the container silently so Tab navigation works correctly
      // without showing a visible ring (tabindex=-1 elements are not tabbable).
      root.tabIndex = -1;
      root.focus({ preventScroll: true });
    }

    /**
     * Handles keydown events to implement circular Tab navigation and Escape dismissal.
     * Wraps focus from the last element back to the first (and vice versa via Shift-Tab).
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements();
      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus({ preventScroll: true });
      previousFocusRef.current = null;
    };
  }, [isActive, onEscape]);

  return rootRef;
}
