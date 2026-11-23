'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useMotionPreference } from '@/components/ui/use-motion-preference';
import type { ResolvedTheme, ThemeSelection } from '@/lib/theme';

function skipThemeWipe(transition: ViewTransition | null) {
  if (transition?.types.has('animate-ui-theme')) transition.skipTransition();
}

export function useThemeWipe(applyCurrent: () => void) {
  const { reduce } = useMotionPreference();
  const preparing = useRef(false);
  useEffect(() => {
    if (reduce) skipThemeWipe(document.activeViewTransition);
  }, [reduce]);
  const finishWipe = useCallback(() => {
    if (!preparing.current) applyCurrent();
  }, [applyCurrent]);

  const startWipe = useCallback(
    (
      selection: ThemeSelection,
      resolved: ResolvedTheme,
      toggleTheme: (selection: ThemeSelection) => void,
    ) => {
      const active = document.activeViewTransition;
      const paintedDark = document.documentElement.classList.contains('dark');
      if (
        active ||
        preparing.current ||
        reduce ||
        !document.startViewTransition ||
        paintedDark === (resolved === 'dark')
      ) {
        // Interrupt only our own wipe. Give navigation captures priority.
        skipThemeWipe(active);
        applyCurrent();
        return;
      }

      preparing.current = true;
      const ready = Promise.resolve(toggleTheme(selection));
      const transition = document.activeViewTransition;
      const settle = () => {
        preparing.current = false;
        applyCurrent();
      };
      // An interrupted capture still runs its update callback. Reconcile after it
      // so the primitive cannot restore an older color over a faster selection.
      void ready.then(
        settle,
        () => transition?.updateCallbackDone.then(settle, settle) ?? settle(),
      );
    },
    [applyCurrent, reduce],
  );
  return { startWipe, finishWipe };
}
