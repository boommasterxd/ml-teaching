import type { RefObject } from 'react';
import type { Goal } from './RewardBoard';

export type PreviewKind = 'image' | 'reward';
export type PreviewSlots = Record<PreviewKind, RefObject<HTMLDivElement | null>>;

export interface PreviewPlayback {
  signal: 'cat' | 'dog';
  imageSequence: number;
  animateImage: boolean;
  showImageMotion: boolean;
  rewardGoal: Goal | null;
  rewardSequence: number;
  animateReward: boolean;
  showRewardMotion: boolean;
}
