'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { applyTheme, type ResolvedTheme, type ThemeSelection } from '@/lib/theme';
import type { ThemePreference } from './useThemePreference';

interface ActiveRequest {
  selection: ThemeSelection;
  revision: number;
}

/** Serialize the public primitive callback; retain only the latest requested choice. */
export function useThemeWipe(
  current: RefObject<ThemePreference>,
  animationFailed: () => void,
  captureAppearance: (resolved: ResolvedTheme) => void,
) {
  const active = useRef<ActiveRequest | null>(null);
  const lastStarted = useRef(-1);
  const mounted = useRef(false);
  const [epoch, setEpoch] = useState(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const complete = useCallback(
    (selection: ThemeSelection) => {
      if (!mounted.current || active.current?.selection !== selection) return;
      const request = active.current;
      active.current = null;
      const latest = current.current;
      const painted = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      if (latest.revision === request.revision || !latest.animate || latest.resolved === painted) {
        applyTheme(latest.selection, latest.resolved);
        lastStarted.current = latest.revision;
      }
      captureAppearance(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      setEpoch((value) => value + 1);
    },
    [current, captureAppearance],
  );

  const start = useCallback(
    (toggleTheme: (selection: ThemeSelection) => void) => {
      const latest = current.current;
      if (
        !mounted.current ||
        active.current ||
        !latest.animate ||
        lastStarted.current >= latest.revision
      )
        return;
      const request = { selection: latest.selection, revision: latest.revision };
      active.current = request;
      lastStarted.current = request.revision;
      // The official async function resolves after snapshot readiness; setTheme completes the wipe.
      void Promise.resolve(toggleTheme(request.selection))
        .then(() => {
          if (!mounted.current) return;
          const next = current.current;
          if (next.revision !== request.revision && !next.animate)
            applyTheme(next.selection, next.resolved);
        })
        .catch((error: unknown) => {
          if (!mounted.current || active.current !== request) return;
          if (!(error instanceof DOMException && error.name === 'AbortError')) animationFailed();
          complete(request.selection);
        });
    },
    [current, animationFailed, complete],
  );

  return { complete, start, epoch };
}

export function ThemeRequest({
  revision,
  epoch,
  start,
  toggleTheme,
}: {
  revision: number;
  epoch: number;
  start: (toggleTheme: (selection: ThemeSelection) => void) => void;
  toggleTheme: (selection: ThemeSelection) => void;
}) {
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) start(toggleTheme);
    });
    return () => {
      cancelled = true;
    };
  }, [revision, epoch, start, toggleTheme]);
  return null;
}
