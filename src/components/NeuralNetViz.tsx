'use client';

import { useEffect, useState } from 'react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import { Shine } from '@animate-ui/react/primitives/effects/shine';
import {
  motionTokens,
  ReducedMotionConfig,
  ReducedMotionContext,
  useReducedMotionSetting,
  useShouldReduceMotion,
} from '@animate-ui/react/utils/motion';
import { NetworkLoadAlert } from './NeuralNetFrame';
import ResultFeedback from './network/ResultFeedback';
import { Progress } from './ui/progress';
import { Text } from './ui/typography';
import { ANIMATION, NETWORK_STAGES } from '../constants';
import { KNN_EXAMPLES, KNN_NEIGHBOR_COUNT } from '../lib/network-demo';
import type { useNeuralNetAnimation } from '../hooks/useNeuralNetAnimation';
import FeatureEngine from './network/FeatureEngine';
import KnnEngine from './network/KnnEngine';
import { FLOW_HEAD_PATHS, FLOW_PATHS, NetworkScene } from './network/NetworkScene';
import { NETWORK_EXAMPLES, type ExampleSignal } from './network/examples';

const voteFillTransition = {
  ...motionTokens.transition.fill,
  duration: ANIMATION.STEP_DURATION_MS / 1000,
};

function SignalFlow({ active, sequence }: { active: boolean; sequence: number }) {
  const reduce = useShouldReduceMotion();
  const duration = active && !reduce ? ANIMATION.STEP_DURATION_MS / 1000 : 0;
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      className="network-signal-flow"
      stroke="var(--primary)"
      strokeWidth="5"
      aria-hidden="true"
    >
      {FLOW_PATHS.map((d, index) => (
        <Effect
          asChild
          key={`${sequence}-${index}`}
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: active ? 1 : 0 }}
          transition={{
            duration: duration * 0.7,
            ease: motionTokens.ease.draw,
          }}
        >
          <path d={d} data-flow-part="shaft" />
        </Effect>
      ))}
      {FLOW_HEAD_PATHS.map((d, index) => (
        <Effect
          asChild
          key={`${sequence}-head-${index}`}
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: active ? 1 : 0 }}
          transition={{
            duration: duration * 0.3,
            delay: duration * 0.7,
            ease: motionTokens.ease.draw,
          }}
        >
          <path d={d} data-flow-part="head" />
        </Effect>
      ))}
      {active && !reduce && (
        <Effect
          asChild
          key={`${sequence}-packet`}
          initial={{ pathLength: 0.15, pathOffset: 0, opacity: 0 }}
          animate={{ pathOffset: [0, 0.85], opacity: [0, 1, 0] }}
          transition={{ duration: duration * 0.7, ease: 'linear' }}
        >
          <path d={FLOW_PATHS[0]} strokeWidth="8" strokeLinecap="round" />
        </Effect>
      )}
    </svg>
  );
}

function ResultBars({ signal, ready }: { signal: ExampleSignal; ready: boolean }) {
  return (
    <div className="network-readout">
      {(['dog', 'cat'] as const).map((type) => {
        const example = KNN_EXAMPLES[signal];
        const winner = type === example.winner;
        const votes = example.votes[type];
        const value = ready ? Math.round((votes / KNN_NEIGHBOR_COUNT) * 100) : 0;
        return (
          <div key={type} className="network-score" data-winner={(ready && winner) || undefined}>
            <div className="flex items-center justify-between gap-4">
              <Text variant="small">{NETWORK_EXAMPLES[type].name}</Text>
              <Text variant="small" className="font-mono tabular-nums">
                {ready ? `${votes} ${votes === 1 ? 'Stimme' : 'Stimmen'}` : '—'}
              </Text>
            </div>
            {/* Motion reads its reduction setting when the indicator mounts. */}
            <ReducedMotionConfig remount>
              <Progress
                value={value}
                indicatorTransition={voteFillTransition}
                aria-label={`Nachbarstimmen ${NETWORK_EXAMPLES[type].name}`}
                aria-valuetext={
                  ready ? `${votes} von ${KNN_NEIGHBOR_COUNT} Stimmen` : 'Noch keine Stimmen'
                }
              />
            </ReducedMotionConfig>
          </div>
        );
      })}
    </div>
  );
}

type NetworkState = ReturnType<typeof useNeuralNetAnimation>;

export function NetworkDiagram({
  activeSignal,
  animStep,
  animating,
  result,
  sequence,
  visible,
  onReady,
  preparing = false,
  failed = false,
  requestedSignal,
}: Omit<NetworkState, 'triggerAnimation'> & {
  visible: boolean;
  onReady?: () => void;
  preparing?: boolean;
  failed?: boolean;
  requestedSignal?: ExampleSignal;
}) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  const motion = useReducedMotionSetting();
  const [interruptedSequence, setInterruptedSequence] = useState(0);
  const holdEffects = !visible || interruptedSequence === sequence;
  // Finish the current decorative effects without replaying them when playback resumes.
  if (!visible && sequence !== interruptedSequence) setInterruptedSequence(sequence);
  const signal = activeSignal ?? requestedSignal ?? 'dog';
  return (
    <ReducedMotionContext value={holdEffects ? 'always' : motion}>
      <NetworkScene
        signal={activeSignal ?? requestedSignal ?? null}
        effects={{
          engine: <FeatureEngine step={animStep} sequence={sequence} signal={signal} />,
          neighbors: <KnnEngine step={animStep} sequence={sequence} signal={signal} />,
          scan: (
            <Shine
              key={sequence}
              enable={animStep >= 0}
              loop={false}
              duration={ANIMATION.STEP_DURATION_MS}
              color="var(--primary)"
              opacity={0.45}
              style={{ position: 'absolute', inset: 0 }}
            />
          ),
          inbound: <SignalFlow active={animStep >= NETWORK_STAGES.INBOUND} sequence={sequence} />,
          matching: <SignalFlow active={animStep >= NETWORK_STAGES.MATCHING} sequence={sequence} />,
          outbound: <SignalFlow active={animStep >= NETWORK_STAGES.OUTBOUND} sequence={sequence} />,
          result: <ResultBars signal={signal} ready={animStep >= NETWORK_STAGES.OUTPUT} />,
        }}
      />
      {failed ? (
        <NetworkLoadAlert />
      ) : (
        <div className="network-result" role="status">
          {preparing ? (
            <Text variant="muted">Beispiel wird geladen…</Text>
          ) : result ? (
            <ResultFeedback key={sequence} signal={signal} />
          ) : (
            <Text variant="muted">
              {animating ? 'Signal wird verarbeitet…' : 'Wähle ein Beispiel.'}
            </Text>
          )}
        </div>
      )}
    </ReducedMotionContext>
  );
}
