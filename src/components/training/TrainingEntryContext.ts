'use client';

import { createContext, useContext } from 'react';
import type { TrainingEngine } from '@/hooks/useTrainingEngine';

export interface TrainingEntryOptions {
  opener: HTMLElement | null;
  onReady: () => void;
}

export const TrainingEntryContext = createContext<{
  openEntry: (trigger: HTMLElement | null, options?: TrainingEntryOptions) => void;
  prepareEntry: () => void;
  pendingTrigger?: HTMLElement | null;
  cancelPendingEntry?: () => void;
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
  clearTrainingConsent: () => void;
  grantConsent: (remember: boolean) => void;
} | null>(null);

export function useTrainingSession() {
  const value = useContext(TrainingSessionContext);
  if (!value) throw new Error('The training route requires its session provider.');
  return value;
}
