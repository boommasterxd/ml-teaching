import type { SubscribePredictionFeatures } from '@/hooks/usePredictionLoop';
import type { PredictionSpaceResult } from '@/hooks/usePredictionSpacePreparation';
import type { MLClass } from '@/types/ml';
import { PredictionPlotPlaceholder } from './PredictionDiagram';
import { Spinner } from './ui/spinner';
import { Text } from './ui/typography';

export function DeferredPredictionSpace({
  result,
  classes,
  subscribeToFeatures,
}: {
  result: PredictionSpaceResult | undefined;
  classes: readonly MLClass[];
  subscribeToFeatures: SubscribePredictionFeatures;
}) {
  if (!result) {
    return (
      <PredictionPlotPlaceholder classes={classes}>
        <Text
          variant="muted"
          role="status"
          className="absolute inset-0 flex items-center justify-center gap-2 p-2 text-center"
        >
          <Spinner aria-hidden="true" />
          Merkmalsraum wird vorbereitet …
        </Text>
      </PredictionPlotPlaceholder>
    );
  }
  if ('failed' in result) {
    return (
      <PredictionPlotPlaceholder classes={classes}>
        <Text variant="muted" className="absolute inset-0 grid place-items-center p-2 text-center">
          Der Merkmalsraum konnte nicht angezeigt werden.
        </Text>
      </PredictionPlotPlaceholder>
    );
  }
  const { Space } = result;
  return <Space classes={classes} model={result.model} subscribeToFeatures={subscribeToFeatures} />;
}
