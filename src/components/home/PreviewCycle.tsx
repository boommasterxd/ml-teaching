import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useInView } from 'motion/react';
import { useMotionTokens, useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import { usePageVisible } from '@animate-ui/react/utils/use-page-visible';
import { prepareExample } from '@/components/network/prepare-example';
import { isLargeViewport, subscribeToLargeViewport } from '@/lib/media-queries';
import { useHomePlayback } from './HomePlaybackProvider';
import { rewardPreviewFade, signalPreviewFade } from './preview-motion';
import type { PreviewPlayback, PreviewSlots } from './preview-types';

const desktopTurnMs = 4_000;
const desktopRestMs = 1_000;
const mobileTurnMs = 2_800;
const mobileRestMs = 150;

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

function useDesktopPlayback(
  showImageMotion: boolean,
  showRewardMotion: boolean,
  dogPhoto: ReturnType<typeof useDogPhoto>,
): PreviewPlayback {
  const { tempo } = useMotionTokens();
  const [{ step, resting }, setCycle] = useState({ step: 0, resting: false });
  const turn = turns[step % turns.length];
  const imageTurn = turn.panel === 'image';
  const nextVisible = visibleStep(step, showImageMotion, showRewardMotion);
  if (nextVisible !== step) setCycle({ step: nextVisible, resting: false });
  const dogTurn = imageTurn && turn.signal === 'dog';
  const waitingForDog = dogTurn && showImageMotion && dogPhoto === 'pending';
  const playing = (showImageMotion || showRewardMotion) && !waitingForDog;
  const imageReady = !dogTurn || dogPhoto === 'ready';
  const handoff = showImageMotion && showRewardMotion && imageReady;
  const fadeSeconds = imageTurn ? signalPreviewFade.duration : rewardPreviewFade.duration;
  const duration = resting ? fadeSeconds * tempo * 1000 + desktopRestMs : desktopTurnMs;
  const activePanel = playing && !resting ? turn.panel : null;

  const advance = useEffectEvent(() => {
    setCycle(!resting && handoff ? { step, resting: true } : { step: step + 1, resting: false });
  });
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => advance(), duration);
    return () => window.clearTimeout(timer);
  }, [duration, playing, resting, step]);

  return {
    signal: dogPhoto === 'ready' ? turn.signal : 'cat',
    imageSequence: `desktop-${imageTurn ? step : step - 1}`,
    animateImage: activePanel === 'image' && showImageMotion && imageReady,
    showImageMotion,
    rewardGoal: turn.goal,
    rewardSequence: `desktop-${imageTurn ? step - 1 : step}`,
    animateReward: activePanel === 'reward' && showRewardMotion,
    showRewardMotion,
  };
}

function useMobileTurn(visible: boolean, fadeSeconds: number) {
  const { tempo } = useMotionTokens();
  const [cycle, setCycle] = useState({ visible, phase: visible ? 0 : -2 });
  const { phase } = cycle;
  const active = phase % 2 === 0;
  if (visible !== cycle.visible) {
    // Reentry starts a fresh turn, even if the previous one was interrupted.
    setCycle({ visible, phase: visible ? phase + (active ? 2 : 1) : phase });
  }

  const duration = active ? mobileTurnMs * tempo : fadeSeconds * tempo * 1000 + mobileRestMs;
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setCycle({ visible, phase: phase + 1 }), duration);
    return () => window.clearTimeout(timer);
  }, [duration, phase, visible]);

  return { turn: Math.floor(phase / 2), playing: visible && active };
}

function useMobilePlayback(
  showImageMotion: boolean,
  showRewardMotion: boolean,
  dogReady: boolean,
): PreviewPlayback {
  const image = useMobileTurn(showImageMotion, signalPreviewFade.duration);
  const reward = useMobileTurn(showRewardMotion, rewardPreviewFade.duration);
  const [example, setExample] = useState<{
    turn: number;
    signal: PreviewPlayback['signal'];
  }>({ turn: image.turn, signal: 'cat' });
  if (example.turn !== image.turn) {
    setExample({ turn: image.turn, signal: dogReady && image.turn % 2 === 1 ? 'dog' : 'cat' });
  }

  return {
    signal: example.signal,
    imageSequence: `mobile-${image.turn}`,
    animateImage: image.playing,
    showImageMotion,
    rewardGoal: reward.turn % 2 === 1 ? 'treasure' : 'star',
    rewardSequence: `mobile-${reward.turn}`,
    animateReward: reward.playing,
    showRewardMotion,
  };
}

function usePreviewPlayback(slots: PreviewSlots): PreviewPlayback {
  const desktop = useSyncExternalStore(subscribeToLargeViewport, isLargeViewport, () => false);
  const { showImageMotion, showRewardMotion } = usePreviewViewport(slots);
  const dogPhoto = useDogPhoto(showImageMotion);
  const desktopPlayback = useDesktopPlayback(
    desktop && showImageMotion,
    desktop && showRewardMotion,
    dogPhoto,
  );
  const mobilePlayback = useMobilePlayback(
    !desktop && showImageMotion,
    !desktop && showRewardMotion,
    dogPhoto === 'ready',
  );
  return desktop ? desktopPlayback : mobilePlayback;
}

/** Starts playback without moving the server-rendered cards into a new tree. */
export function PreviewCycle({
  slots,
  update,
}: {
  slots: PreviewSlots;
  update: (value: PreviewPlayback) => void;
}) {
  const {
    signal,
    imageSequence,
    animateImage,
    showImageMotion,
    rewardGoal,
    rewardSequence,
    animateReward,
    showRewardMotion,
  } = usePreviewPlayback(slots);
  useLayoutEffect(() => {
    update({
      signal,
      imageSequence,
      animateImage,
      showImageMotion,
      rewardGoal,
      rewardSequence,
      animateReward,
      showRewardMotion,
    });
  }, [
    signal,
    imageSequence,
    animateImage,
    showImageMotion,
    rewardGoal,
    rewardSequence,
    animateReward,
    showRewardMotion,
    update,
  ]);
  return null;
}
