'use client';

import { Activity, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import {
  DiagramSurface,
  NetworkInputButtons,
  NetworkLoadAlert,
  StaticNetworkDiagram,
} from '@/components/NeuralNetFrame';
import { useNeuralNetAnimation } from '@/hooks/useNeuralNetAnimation';
import { prepareExample } from '@/components/network/prepare-example';
import type { ExampleSignal } from '@/components/network/examples';

let modulePromise: ReturnType<typeof importDemo> | undefined;
function importDemo() {
  return import('@/components/NeuralNetViz').then((module) => ({ default: module.NetworkDiagram }));
}
function prepareDemo() {
  modulePromise ??= importDemo().catch((error: unknown) => {
    modulePromise = undefined;
    throw error;
  });
  return modulePromise;
}
const NetworkDiagram = lazy(prepareDemo);

function useMountedRef() {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return mounted;
}

export default function DeferredNetworkDemo() {
  const [prepared, setPrepared] = useState(false);
  const [active, setActive] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pendingSignal, setPendingSignal] = useState<'dog' | 'cat' | null>(null);
  const pending = useRef(false);
  const ready = useRef(false);
  const mounted = useMountedRef();
  const state = useNeuralNetAnimation();
  const { triggerAnimation } = state;

  const prepare = (signal?: ExampleSignal) => {
    void Promise.all([prepareDemo(), signal ? prepareExample(signal) : Promise.resolve()])
      .then(() => {
        if (mounted.current) setPrepared(true);
      })
      .catch(() => {});
  };
  const activate = (signal: 'dog' | 'cat') => {
    if (pending.current || state.animating) return;
    pending.current = true;
    ready.current = false;
    setPendingSignal(signal);
    setFailed(false);
    void Promise.all([prepareDemo(), prepareExample(signal)])
      .then(() => {
        if (!mounted.current) return;
        setPrepared(true);
        ready.current = true;
        if (active) {
          pending.current = false;
          ready.current = false;
          triggerAnimation(signal);
          setPendingSignal(null);
        } else setActive(true);
      })
      .catch(() => {
        if (!mounted.current) return;
        pending.current = false;
        ready.current = false;
        setPendingSignal(null);
        setFailed(true);
      });
  };
  const startPreparedSignal = useCallback(() => {
    if (!pendingSignal || !pending.current || !ready.current) return;
    pending.current = false;
    ready.current = false;
    triggerAnimation(pendingSignal);
    setPendingSignal(null);
  }, [pendingSignal, triggerAnimation]);

  return (
    <div
      className="landing-demo"
      onPointerEnter={() => prepare()}
      onFocusCapture={() => prepare()}
      onPointerDown={() => prepare()}
    >
      <DiagramSurface
        isPreparing={Boolean(pendingSignal)}
        controls={
          <NetworkInputButtons
            activeSignal={pendingSignal ?? state.activeSignal}
            busy={Boolean(pendingSignal) || state.animating}
            onTrigger={activate}
            onIntent={prepare}
          />
        }
      >
        {!active && (
          <>
            <StaticNetworkDiagram />
            {failed ? (
              <NetworkLoadAlert />
            ) : (
              <p className="network-result text-sm text-muted-foreground" role="status">
                {pendingSignal ? 'Beispiel wird geladen…' : 'Wähle ein Beispiel.'}
              </p>
            )}
          </>
        )}
        {prepared && (
          <Suspense fallback={null}>
            <Activity mode={active ? 'visible' : 'hidden'}>
              <NetworkDiagram
                {...state}
                onReady={startPreparedSignal}
                preparing={Boolean(pendingSignal)}
                failed={failed}
                requestedSignal={pendingSignal ?? undefined}
              />
            </Activity>
          </Suspense>
        )}
      </DiagramSurface>
    </div>
  );
}
