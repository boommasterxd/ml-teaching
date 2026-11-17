'use client';

import { createContext, useContext } from 'react';

/** Flow owns initially visible content after client navigation; scroll admission remains local. */
export const InitialEntryContext = createContext(true);
export const useInitialEntry = () => useContext(InitialEntryContext);
export const EntryViewportReadyContext = createContext(true);
export const useEntryViewportReady = () => useContext(EntryViewportReadyContext);
