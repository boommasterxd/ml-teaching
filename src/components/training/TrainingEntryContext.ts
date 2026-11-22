'use client';

import { createContext, useContext } from 'react';
import type { TrainingEngine } from '@/hooks/useTrainingEngine';

export const TrainingEntryContext = createContext<{
  openEntry: (opener: HTMLElement | null) => void;
  prepareEntry: () => void;
} | null>(null);

export function useTrainingEntry() {
  return useContext(TrainingEntryContext);
}

export const TrainingSessionContext = createContext<{
  engine: TrainingEngine;
  pendingArrival: boolean;
  workspaceVersion: number;
  setupSuppressed: boolean;
  prepareWithdrawal: () => void;
  revokeConsent: () => void;
  grantConsent: (remember: boolean) => void;
} | null>(null);

export function useTrainingSession() {
  const value = useContext(TrainingSessionContext);
  if (!value) throw new Error('The training route requires its session provider.');
  return value;
}
