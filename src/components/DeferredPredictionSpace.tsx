import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';
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

/** Admit the chart at the container breakpoint defined by the prediction panel. */
function useSpaceWidth(area: RefObject<HTMLDivElement | null>, enabled: boolean) {
  const [wide, setWide] = useState(false);
  useLayoutEffect(() => {
    const element = area.current;
    if (!enabled || !element) return;
    function update() {
      if (element) {
        setWide(getComputedStyle(element).getPropertyValue('--prediction-space').trim() === '1');
      }
    }
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [area, enabled]);
  return enabled && wide;
}

export function useDeferredPredictionSpace(
  area: RefObject<HTMLDivElement | null>,
  classes: readonly MLClass[],
  enabled: boolean,
  active: boolean,
) {
  const available = useSpaceWidth(area, enabled);
  const [intent, setIntent] = useState<readonly MLClass[]>();
  const [state, setState] = useState<SpaceState>();
  const shouldPrepare = available && (active || intent === classes);

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
    visible: available && active,
    result: state?.source === classes ? state : undefined,
    prepare: () => {
      if (available) setIntent(classes);
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
        className="flex aspect-[2/1] items-center justify-center gap-2"
      >
        <Spinner aria-hidden="true" />
        Merkmalsraum wird vorbereitet …
      </Text>
    );
  }
  if ('failed' in result) {
    return <Text variant="muted">Der Merkmalsraum konnte nicht angezeigt werden.</Text>;
  }
  const Space = result.module.default;
  return <Space classes={classes} model={result.model} subscribeToFeatures={subscribeToFeatures} />;
}
