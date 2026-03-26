/**
 * Hook that traps keyboard focus inside a container element (e.g. a modal).
 * Restores focus to the previously active element on deactivation.
 */
import { useEffect, useRef } from 'react';

/** Traps Tab/Shift-Tab focus within a ref'd container and handles Escape. */
export function useFocusTrap(isActive: boolean, autoFocusFirst: boolean = false, onEscape?: () => void) {
  const rootRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !rootRef.current) return;

    const root = rootRef.current;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const getFocusableElements = () => Array.from(
      root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );

    const firstFocusable = getFocusableElements()[0];

    if (autoFocusFirst && firstFocusable) {
      firstFocusable.focus({ preventScroll: true });
    } else if (!autoFocusFirst) {
      // Set tabIndex to -1 so the div can be focused programmatically
      root.tabIndex = -1;
      // Focus the container itself to avoid outlines on buttons while maintaining accessibility.
      root.focus({ preventScroll: true });
    }

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
