'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { ThemeToggler } from '@animate-ui/react/primitives/effects/theme-toggler';
import { useThemePreference } from './useThemePreference';
import { ThemeRequest, useThemeWipe } from './useThemeWipe';

type ThemeContextValue = Pick<
  ReturnType<typeof useThemePreference>,
  'preference' | 'select' | 'setRemember'
>;
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('Theme controls require ThemeProvider.');
  return value;
}

/** Always render the upstream wipe style during SSG so its exact bytes receive a CSP hash. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { current, animationFailed, captureAppearance, ...value } = useThemePreference();
  const wipe = useThemeWipe(current, animationFailed, captureAppearance);
  return (
    <ThemeContext value={value}>
      <ThemeToggler
        theme={value.preference.selection}
        resolvedTheme={value.preference.applied}
        setTheme={wipe.complete}
      >
        {({ toggleTheme }) => (
          <>
            <ThemeRequest
              revision={value.preference.revision}
              epoch={wipe.epoch}
              start={wipe.start}
              toggleTheme={toggleTheme}
            />
            {children}
          </>
        )}
      </ThemeToggler>
    </ThemeContext>
  );
}
