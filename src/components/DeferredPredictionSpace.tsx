import { useRef } from 'react';
import type { SubscribePredictionFeatures } from '@/hooks/usePredictionLoop';
import type { PredictionSpaceResult } from '@/hooks/usePredictionSpacePreparation';
import type { MLClass } from '@/types/ml';
import { PredictionPlotPlaceholder } from './PredictionDiagram';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { Text } from './ui/typography';

export function DeferredPredictionSpace({
  result,
  classes,
  subscribeToFeatures,
  onRetry,
}: {
  result: PredictionSpaceResult | undefined;
  classes: readonly MLClass[];
  subscribeToFeatures: SubscribePredictionFeatures;
  onRetry: () => void;
}) {
  const region = useRef<HTMLDivElement>(null);
  const loaded = result && 'Space' in result ? result : undefined;
  const Space = loaded?.Space;
  return (
    <div
      ref={region}
      role="group"
      aria-label="Merkmalsraum"
      tabIndex={-1}
      className="grid min-w-0 gap-2"
    >
      {loaded && Space ? (
        <Space classes={classes} model={loaded.model} subscribeToFeatures={subscribeToFeatures} />
      ) : (
        <PredictionPlotPlaceholder classes={classes}>
          {result ? (
            <div className="absolute inset-0 flex overflow-y-auto p-2">
              <Alert variant="destructive" className="m-auto w-auto max-w-full px-2 py-1.5">
                <AlertDescription className="justify-items-center text-center">
                  Der Merkmalsraum konnte nicht angezeigt werden.
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto min-h-11 whitespace-normal"
                    onClick={() => {
                      region.current?.focus({ preventScroll: true });
                      onRetry();
                    }}
                  >
                    Erneut versuchen
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <Text
              variant="muted"
              role="status"
              className="absolute inset-0 flex items-center justify-center gap-2 p-2 text-center"
            >
              <Spinner aria-hidden="true" />
              Merkmalsraum wird vorbereitet …
            </Text>
          )}
        </PredictionPlotPlaceholder>
      )}
    </div>
  );
}
