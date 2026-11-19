import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import { usePageVisible } from '@animate-ui/react/utils/use-page-visible';
import { prepareExample } from '@/components/network/prepare-example';
import { useHomePlayback } from './HomePlaybackProvider';
import type { PreviewPlayback, PreviewSlots } from './preview-types';

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

function usePreviewViewport({ image, reward }: PreviewSlots) {
  const imageInView = useInView(image, { amount: 0.2 });
  const rewardInView = useInView(reward, { amount: 0.2 });
  const visible = usePageVisible();
  const reduceMotion = useShouldReduceMotion();
  const { paused } = useHomePlayback();
  const available = visible && !reduceMotion && !paused;
  return {
    showImageMotion: available && imageInView,
    showRewardMotion: available && rewardInView,
  };
}

function usePreviewPlayback(slots: PreviewSlots): PreviewPlayback {
  const { showImageMotion, showRewardMotion } = usePreviewViewport(slots);
  const [step, setStep] = useState(0);
  const turn = turns[step % turns.length];
  const dogPhoto = useDogPhoto(showImageMotion);
  const imageTurn = turn.panel === 'image';
  // Stacked cards use each turn for the illustration the reader is actually looking at.
  const nextVisible = visibleStep(step, showImageMotion, showRewardMotion);
  if (nextVisible !== step) setStep(nextVisible);
  const dogTurn = imageTurn && turn.signal === 'dog';
  const waitingForDog = dogTurn && showImageMotion && dogPhoto === 'pending';
  const playing = (showImageMotion || showRewardMotion) && !waitingForDog;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setStep(step + 1), previewIntervalMs);
    return () => window.clearTimeout(timer);
  }, [playing, step]);

  const animateImage =
    playing && showImageMotion && imageTurn && (!dogTurn || dogPhoto === 'ready');
  const signal = dogPhoto === 'ready' ? turn.signal : 'cat';
  const imageSequence = imageTurn ? step : step - 1;
  const rewardSequence = imageTurn ? step - 1 : step;
  const animateReward = playing && showRewardMotion && !imageTurn;
  const rewardGoal = turn.goal;
  return useMemo(
    () => ({
      signal,
      imageSequence,
      animateImage,
      showImageMotion,
      rewardGoal,
      rewardSequence,
      animateReward,
      showRewardMotion,
    }),
    [
      signal,
      imageSequence,
      animateImage,
      showImageMotion,
      rewardGoal,
      rewardSequence,
      animateReward,
      showRewardMotion,
    ],
  );
}

/** Starts the shared cycle without moving the server-rendered cards into a new tree. */
export function PreviewCycle({
  slots,
  update,
}: {
  slots: PreviewSlots;
  update: (value: PreviewPlayback) => void;
}) {
  const playback = usePreviewPlayback(slots);
  useLayoutEffect(() => update(playback), [playback, update]);
  return null;
}
