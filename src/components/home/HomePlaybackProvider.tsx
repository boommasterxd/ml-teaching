'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

const HomePlaybackContext = createContext<{ paused: boolean; togglePause: () => void } | null>(
  null,
);

export function HomePlaybackProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  return (
    <HomePlaybackContext value={{ paused, togglePause: () => setPaused((value) => !value) }}>
      {children}
    </HomePlaybackContext>
  );
}

export function useHomePlayback() {
  const playback = useContext(HomePlaybackContext);
  if (!playback) throw new Error('Homepage animations require a HomePlaybackProvider.');
  return playback;
}
