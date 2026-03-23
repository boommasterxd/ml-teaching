/**
 * Custom hook to trap focus within a specific element, useful for modals and overlays.
 * Ensures accessibility by preventing focus from leaving the active component.
 */
import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive: boolean, autoFocusFirst: boolean = false) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !rootRef.current) return;

    const root = rootRef.current;
    const focusableElements = root.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (autoFocusFirst && firstElement) {
      firstElement.focus({ preventScroll: true });
    } else if (!autoFocusFirst) {
      // Set tabIndex to -1 so the div can be focused programmatically
      root.tabIndex = -1;
      // Focus the container itself to avoid outlines on buttons while maintaining accessibility.
      root.focus({ preventScroll: true });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return rootRef;
}
