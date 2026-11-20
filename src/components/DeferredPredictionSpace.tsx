import { useEffect, useState } from 'react';
import type { SubscribePredictionFeatures } from '@/hooks/usePredictionLoop';
import type { MLClass } from '@/types/ml';
import { Spinner } from './ui/spinner';
import { Text } from './ui/typography';

type SpaceModule = typeof import('./PredictionSpace');
type SpaceState =
  | {
      source: readonly MLClass[];
      module: SpaceModule;
      model: Awaited<ReturnType<SpaceModule['prepareSpace']>>;
    }
  | { source: readonly MLClass[]; failed: true };

let pending: Promise<SpaceModule> | undefined;

function loadSpace() {
  pending ??= import('./PredictionSpace').catch((error: unknown) => {
    pending = undefined;
    throw error;
  });
  return pending;
}

export function useDeferredPredictionSpace(
  classes: readonly MLClass[],
  enabled: boolean,
  active: boolean,
) {
  const [intent, setIntent] = useState<readonly MLClass[]>();
  const [state, setState] = useState<SpaceState>();
  const shouldPrepare = enabled && (active || intent === classes);

  useEffect(() => {
    if (!shouldPrepare) return;
    const controller = new AbortController();
    const { signal } = controller;
    void loadSpace()
      .then(async (module) => {
        signal.throwIfAborted();
        const model = await module.prepareSpace(classes, signal);
        if (!signal.aborted) setState({ source: classes, module, model });
      })
      .catch(() => {
        if (signal.aborted) return;
        setIntent(undefined);
        setState({ source: classes, failed: true });
      });
    return () => controller.abort();
  }, [classes, shouldPrepare]);

  return {
    visible: enabled && active,
    result: state?.source === classes ? state : undefined,
    prepare: () => {
      if (enabled) setIntent(classes);
    },
  };
}

export function DeferredPredictionSpace({
  result,
  classes,
  subscribeToFeatures,
}: {
  result: SpaceState | undefined;
  classes: readonly MLClass[];
  subscribeToFeatures: SubscribePredictionFeatures;
}) {
  if (!result) {
    return (
      <Text
        variant="muted"
        role="status"
        className="absolute inset-0 flex items-center justify-center gap-2 p-2 text-center"
      >
        <Spinner aria-hidden="true" />
        Merkmalsraum wird vorbereitet …
      </Text>
    );
  }
  if ('failed' in result) {
    return (
      <Text variant="muted" className="absolute inset-0 grid place-items-center p-2 text-center">
        Der Merkmalsraum konnte nicht angezeigt werden.
      </Text>
    );
  }
  const Space = result.module.default;
  return <Space classes={classes} model={result.model} subscribeToFeatures={subscribeToFeatures} />;
}
