'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useInView } from 'motion/react';
import { useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import { usePageVisible } from '@animate-ui/react/utils/use-page-visible';
import { prepareExample } from '@/components/network/prepare-example';
import { useHomePlayback } from './HomePlaybackProvider';

const previewIntervalMs = 4_000;

const turns = [
  { panel: 'image', signal: 'dog', goal: null },
  { panel: 'reward', signal: 'dog', goal: 'star' },
  { panel: 'image', signal: 'cat', goal: null },
  { panel: 'reward', signal: 'cat', goal: 'treasure' },
] as const;

function visibleStep(step: number, imageVisible: boolean, rewardVisible: boolean) {
  if (imageVisible === rewardVisible) return step;
  const visiblePanel = imageVisible ? 'image' : 'reward';
  return turns[step % turns.length].panel === visiblePanel ? step : step + 1;
}

function useDogPhoto(prepare: boolean) {
  const [photo, setPhoto] = useState<'pending' | 'ready' | 'unavailable'>('pending');
  const pending = useRef<ReturnType<typeof prepareExample> | undefined>(undefined);

  useEffect(() => {
    if (!prepare || photo !== 'pending') return;
    let active = true;
    pending.current ??= prepareExample('dog');
    void pending.current.then(
      () => {
        if (active) setPhoto('ready');
      },
      () => {
        if (active) setPhoto('unavailable');
      },
    );
    return () => {
      active = false;
    };
  }, [prepare, photo]);

  return photo;
}

function usePreviewPlayback() {
  const imageRef = useRef<HTMLDivElement>(null);
  const rewardRef = useRef<HTMLDivElement>(null);
  const imageInView = useInView(imageRef, { amount: 0.2 });
  const rewardInView = useInView(rewardRef, { amount: 0.2 });
  const visible = usePageVisible();
  const reduceMotion = useShouldReduceMotion();
  const { paused } = useHomePlayback();
  const [step, setStep] = useState(0);
  const turn = turns[step % turns.length];
  const available = visible && !reduceMotion && !paused;
  const showImageMotion = available && imageInView;
  const showRewardMotion = available && rewardInView;
  const dogPhoto = useDogPhoto(showImageMotion);
  const imageTurn = turn.panel === 'image';
  // Stacked cards use each turn for the illustration the reader is actually looking at.
  const nextVisible = visibleStep(step, showImageMotion, showRewardMotion);
  if (nextVisible !== step) setStep(nextVisible);
  const dogTurn = imageTurn && turn.signal === 'dog';
  const waitingForDog = dogTurn && imageInView && dogPhoto === 'pending';
  const playing = (showImageMotion || showRewardMotion) && !waitingForDog;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setStep(step + 1), previewIntervalMs);
    return () => window.clearTimeout(timer);
  }, [playing, step]);

  const animateImage =
    playing && showImageMotion && imageTurn && (!dogTurn || dogPhoto === 'ready');
  const signal = dogPhoto === 'ready' ? turn.signal : 'cat';

  return {
    imageRef,
    rewardRef,
    signal,
    imageSequence: imageTurn ? step : step - 1,
    animateImage,
    showImageMotion,
    rewardGoal: turn.goal,
    rewardSequence: imageTurn ? step - 1 : step,
    animateReward: playing && showRewardMotion && !imageTurn,
    showRewardMotion,
  };
}

const PreviewCycleContext = createContext<ReturnType<typeof usePreviewPlayback> | null>(null);

export function PreviewCycleProvider({ children }: { children: ReactNode }) {
  const playback = usePreviewPlayback();
  return <PreviewCycleContext value={playback}>{children}</PreviewCycleContext>;
}

export function usePreviewCycle() {
  const playback = useContext(PreviewCycleContext);
  if (!playback) throw new Error('Homepage previews require a PreviewCycleProvider.');
  return playback;
}
