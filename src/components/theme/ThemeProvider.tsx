'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { ThemeToggler } from '@animate-ui/react/primitives/effects/theme-toggler';
import type { ThemeSelection } from '@/lib/theme';
import { useThemePreference } from './useThemePreference';

type ThemeContextValue = Pick<
  ReturnType<typeof useThemePreference>,
  'preference' | 'setRemember'
> & { select: (selection: ThemeSelection) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('Theme controls require ThemeProvider.');
  return value;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { preference, select, setRemember, finishWipe } = useThemePreference();
  // Keep the primitive's constant reset style in the hashed static HTML.
  return (
    <ThemeToggler
      theme={preference.selection}
      resolvedTheme={preference.resolved}
      setTheme={finishWipe}
      direction="ltr"
    >
      {({ toggleTheme }) => (
        <ThemeContext
          value={{ preference, select: (theme) => select(theme, toggleTheme), setRemember }}
        >
          {children}
        </ThemeContext>
      )}
    </ThemeToggler>
  );
}
