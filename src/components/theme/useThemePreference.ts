'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@/lib/toast';
import {
  applyTheme,
  parseTheme,
  readRememberedTheme,
  rememberTheme,
  resolveTheme,
  systemPrefersDark,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemeSelection,
} from '@/lib/theme';

export interface ThemePreference {
  selection: ThemeSelection;
  resolved: ResolvedTheme;
  applied: ResolvedTheme;
  remember: boolean;
  revision: number;
  animate: boolean;
}

const initial: ThemePreference = {
  selection: 'system',
  resolved: 'light',
  applied: 'light',
  remember: false,
  revision: 0,
  animate: false,
};

const rememberUnavailable =
  'Dein Browser erlaubt das Merken nicht. Die Auswahl gilt für diesen Aufruf.';

function animationFailed() {
  toast.info('Die Darstellung wurde ohne Animation geändert.', { id: 'theme-animation' });
}

export function useThemePreference() {
  const [preference, setPreference] = useState(initial);
  const current = useRef(initial);
  const update = useCallback((next: ThemePreference) => {
    current.current = next;
    setPreference(next);
  }, []);
  const select = useCallback(
    (selection: ThemeSelection) => {
      const previous = current.current;
      const saved = !previous.remember || rememberTheme(selection);
      if (!saved) toast.error(rememberUnavailable, { id: 'theme-storage' });
      update({
        ...previous,
        selection,
        resolved: resolveTheme(selection, systemPrefersDark()),
        remember: previous.remember && saved,
        revision: previous.revision + 1,
        animate: true,
      });
    },
    [update],
  );
  const setRemember = useCallback(
    (remember: boolean) => {
      const previous = current.current;
      const saved = rememberTheme(remember ? previous.selection : null);
      if (!saved)
        toast.error(
          remember
            ? rememberUnavailable
            : 'Die gespeicherte Auswahl konnte nicht gelöscht werden. Bitte lösche die Website-Daten in deinem Browser.',
          { id: 'theme-storage' },
        );
      update({
        ...previous,
        remember: remember && saved,
      });
    },
    [update],
  );
  const captureAppearance = useCallback(
    (applied: ResolvedTheme) => {
      update({ ...current.current, applied });
    },
    [update],
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyExternal = (selection: ThemeSelection, remember: boolean) => {
      const resolved = resolveTheme(selection, media.matches);
      const previous = current.current;
      if (
        previous.animate ||
        previous.selection !== selection ||
        previous.resolved !== resolved ||
        previous.applied !== resolved ||
        previous.remember !== remember
      ) {
        update({
          selection,
          resolved,
          applied: resolved,
          remember,
          revision: previous.revision + 1,
          animate: false,
        });
      }
      applyTheme(selection, resolved);
    };
    const stored = readRememberedTheme();
    applyExternal(stored ?? 'system', stored !== null);
    const changedSystem = () => {
      if (current.current.selection === 'system') applyExternal('system', current.current.remember);
    };
    const changedStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== THEME_STORAGE_KEY) return;
      try {
        if (event.storageArea && event.storageArea !== window.localStorage) return;
      } catch {
        return;
      }
      const selection = event.key === null ? null : parseTheme(event.newValue);
      applyExternal(selection ?? 'system', selection !== null);
    };
    media.addEventListener('change', changedSystem);
    window.addEventListener('storage', changedStorage);
    return () => {
      media.removeEventListener('change', changedSystem);
      window.removeEventListener('storage', changedStorage);
    };
  }, [update]);

  return { preference, current, select, setRemember, animationFailed, captureAppearance };
}
