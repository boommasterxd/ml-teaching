'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { motionTokens, useTempoTransition } from '@animate-ui/react/utils/motion';
import { motion } from 'motion/react';
import { useThemePreference } from './useThemePreference';
import { useThemeWipe } from './useThemeWipe';

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

function ThemeWipe({ revision, animate }: { revision: number; animate: boolean }) {
  const { visible, finish } = useThemeWipe(revision, animate);
  const transition = useTempoTransition({ duration: 0.7, ease: motionTokens.ease.soft });
  if (!visible) return null;
  return (
    <motion.div
      key={revision}
      aria-hidden="true"
      className="theme-wipe"
      data-theme-wipe=""
      initial={{ clipPath: 'inset(0% 100% 0% 0%)', opacity: 1 }}
      animate={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 0 }}
      transition={transition}
      onAnimationComplete={finish}
    />
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useThemePreference();
  return (
    <ThemeContext value={value}>
      {children}
      <ThemeWipe revision={value.preference.revision} animate={value.preference.animate} />
    </ThemeContext>
  );
}
