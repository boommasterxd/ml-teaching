'use client';

import { Activity, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import Button from '@/components/Button';
import { Play, RotateCcw } from '@/components/icons';
import { StaticNeuralNetViz } from '@/components/NeuralNetFrame';

let modulePromise: ReturnType<typeof importDemo> | undefined;
function importDemo() {
  return import('@/components/NeuralNetViz');
}
function prepareDemo() {
  modulePromise ??= importDemo().catch((error: unknown) => {
    modulePromise = undefined;
    throw error;
  });
  return modulePromise;
}
const NetworkDemo = lazy(prepareDemo);

function MountedDemo() {
  const region = useRef<HTMLDivElement>(null);
  useEffect(() => {
    region.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  }, []);
  return (
    <Effect asChild fade>
      <div ref={region}>
        <NetworkDemo />
      </div>
    </Effect>
  );
}

export default function DeferredNetworkDemo() {
  const [prepared, setPrepared] = useState(false);
  const [active, setActive] = useState(false);
  const [failed, setFailed] = useState(false);
  const ready = active && prepared;

  const prepare = () => {
    void prepareDemo()
      .then(() => setPrepared(true))
      .catch(() => {});
  };
  const activate = () => {
    setActive(true);
    setFailed(false);
    void prepareDemo()
      .then(() => setPrepared(true))
      .catch(() => setFailed(true));
  };
  return (
    <div className="landing-demo" onPointerEnter={prepare} onFocusCapture={prepare}>
      {!ready && (
        <StaticNeuralNetViz
          action={
            <div className="landing-demo-launch">
              <Button
                variant="primary"
                size="lg"
                onPointerDown={prepare}
                onClick={activate}
                disabled={active && !failed}
                aria-describedby="network-demo-intro"
              >
                {failed ? (
                  <RotateCcw data-icon="inline-start" aria-hidden="true" />
                ) : (
                  <Play data-icon="inline-start" aria-hidden="true" />
                )}
                {failed ? 'Erneut versuchen' : active ? 'Demo wird geladen…' : 'Demo starten'}
              </Button>
              {failed && (
                <p role="alert" className="absolute inset-x-0 bottom-full mb-2 text-sm">
                  Die Demo konnte nicht geladen werden. Bitte versuche es erneut.
                </p>
              )}
            </div>
          }
        />
      )}
      {prepared && (
        <Suspense fallback={active ? <p role="status">Demo wird geladen…</p> : null}>
          <Activity mode={active ? 'visible' : 'hidden'}>
            <MountedDemo />
          </Activity>
        </Suspense>
      )}
    </div>
  );
}
