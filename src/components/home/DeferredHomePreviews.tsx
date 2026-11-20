'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useInView } from 'motion/react';
import { useShouldReduceMotion } from '@animate-ui/react/utils/motion';
import { useHomePlayback } from './HomePlaybackProvider';
import { prepareHomePreviews, type HomePreviewRuntime } from './prepare-home-previews';
import type { PreviewKind, PreviewPlayback, PreviewSlots } from './preview-types';

const PreviewContext = createContext<{
  slots: PreviewSlots;
  runtime: HomePreviewRuntime | null;
  playback: PreviewPlayback | null;
} | null>(null);

const preparation = { margin: '240px 0px' } as const;

function useDeferredRuntime(near: boolean) {
  const [runtime, setRuntime] = useState<HomePreviewRuntime | null>(null);
  const [intent, setIntent] = useState(0);
  const { paused } = useHomePlayback();
  const reduceMotion = useShouldReduceMotion();

  useEffect(() => {
    if (runtime || (!near && !intent) || paused || reduceMotion) return;
    let active = true;
    void prepareHomePreviews().then(
      (module) => {
        if (active) setRuntime(module);
      },
      () => {},
    );
    return () => {
      active = false;
    };
  }, [intent, near, paused, reduceMotion, runtime]);

  return {
    runtime,
    onFocus: () => {
      if (!runtime && !paused && !reduceMotion) setIntent((count) => count + 1);
    },
  };
}

export function DeferredHomePreviews({ children }: { children: ReactNode }) {
  const image = useRef<HTMLDivElement>(null);
  const reward = useRef<HTMLDivElement>(null);
  const imageNear = useInView(image, preparation);
  const rewardNear = useInView(reward, preparation);
  const { runtime, onFocus } = useDeferredRuntime(imageNear || rewardNear);
  const [playback, setPlayback] = useState<PreviewPlayback | null>(null);
  const slots = useMemo(() => ({ image, reward }), [image, reward]);

  return (
    <PreviewContext value={{ slots, runtime, playback }}>
      <div className="home-experiments-grid lg:grid-cols-2" onFocusCapture={onFocus}>
        {children}
      </div>
      {runtime && <runtime.PreviewCycle slots={slots} update={setPlayback} />}
    </PreviewContext>
  );
}

export function HomePreview({ kind, children }: { kind: PreviewKind; children: ReactNode }) {
  const context = useContext(PreviewContext);
  if (!context) throw new Error('A homepage preview requires DeferredHomePreviews.');
  const { slots, runtime, playback } = context;
  const isImage = kind === 'image';
  const AnimatedPreview = isImage ? runtime?.InputExperiment : runtime?.RewardPreview;

  return (
    <div ref={slots[kind]} className={isImage ? 'home-input-experiment' : 'reward-experiment'}>
      {AnimatedPreview && playback ? <AnimatedPreview {...playback} /> : children}
    </div>
  );
}
