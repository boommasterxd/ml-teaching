import { ease } from '@animate-ui/react/utils/motion';

export const flowMotion = {
  enterOffset: 16,
  exitOffset: -8,
  enter: { duration: 0.24, ease: ease.out },
  exit: { duration: 0.16, ease: ease.leave },
} as const;
