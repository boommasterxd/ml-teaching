'use client';

import { useState } from 'react';
import { useMotionPreference } from '@/components/ui/use-motion-preference';

/** Retire an interrupted wipe so changing the system preference cannot replay it. */
export function useThemeWipe(revision: number, animate: boolean) {
  const { reduce } = useMotionPreference();
  const [retired, setRetired] = useState(0);
  const pending = animate && revision > retired;
  if (pending && reduce) setRetired(revision);
  return {
    visible: pending && !reduce,
    finish: () => setRetired((complete) => Math.max(complete, revision)),
  };
}
